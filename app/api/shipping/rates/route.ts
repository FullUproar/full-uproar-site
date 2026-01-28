import { NextRequest, NextResponse } from 'next/server';
import { getShipStation, isShipStationConfigured } from '@/lib/shipping/shipstation';
import { prisma } from '@/lib/prisma';

/**
 * Public Shipping Rates API
 *
 * Fetches available shipping rates from ShipStation based on destination address
 * and cart contents (calculates weight from product data).
 */

// Default package dimensions for board games/merch
const DEFAULT_PACKAGE = {
  length: 12,
  width: 9,
  height: 3,
  units: 'inches' as const,
};

// Default weight if product doesn't have one set (2 lbs = 32 oz)
const DEFAULT_ITEM_WEIGHT_OZ = 32;

// Warehouse/origin address - should match your ShipStation warehouse
const WAREHOUSE_ZIP = process.env.WAREHOUSE_ZIP || '10001';

interface CartItem {
  id: number;
  type: 'game' | 'merch';
  quantity: number;
}

interface ShippingRateRequest {
  toAddress: {
    street?: string;
    city: string;
    state: string;
    postalCode: string;
    country?: string;
  };
  cartItems?: CartItem[];
  weight?: number; // Override weight in pounds (for backwards compatibility)
}

interface ShippingRate {
  carrier: string;
  carrierCode: string;
  service: string;
  serviceCode: string;
  priceCents: number;
  estimatedDays: number | null;
  packageType: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: ShippingRateRequest = await request.json();
    const { toAddress, cartItems, weight: overrideWeight } = body;

    if (!toAddress?.postalCode || !toAddress?.state) {
      return NextResponse.json(
        { error: 'Postal code and state are required' },
        { status: 400 }
      );
    }

    // Calculate total weight from cart items
    let weightLbs = overrideWeight || 2; // Default 2 lbs

    if (cartItems && cartItems.length > 0) {
      const calculatedWeight = await calculateCartWeight(cartItems);
      weightLbs = calculatedWeight;
    }

    console.log(`Shipping rates request: ${toAddress.postalCode}, weight: ${weightLbs} lbs`);

    // If ShipStation is configured, get real rates
    if (isShipStationConfigured()) {
      try {
        const rates = await fetchShipStationRates(toAddress, weightLbs);
        if (rates.length > 0) {
          return NextResponse.json({
            rates,
            source: 'shipstation',
            weightLbs
          });
        }
      } catch (error) {
        console.error('ShipStation rate fetch failed:', error);
        // Fall through to calculated rates
      }
    }

    // Fallback to weight-based calculated rates
    const calculatedRates = getCalculatedRates(weightLbs);
    return NextResponse.json({
      rates: calculatedRates,
      source: 'calculated',
      weightLbs
    });

  } catch (error) {
    console.error('Shipping rates error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch shipping rates' },
      { status: 500 }
    );
  }
}

/**
 * Calculate total cart weight from product data
 */
async function calculateCartWeight(cartItems: CartItem[]): Promise<number> {
  let totalOz = 0;

  // Separate games and merch
  const gameIds = cartItems.filter(i => i.type === 'game').map(i => i.id);
  const merchIds = cartItems.filter(i => i.type === 'merch').map(i => i.id);

  // Fetch game weights
  if (gameIds.length > 0) {
    const games = await prisma.game.findMany({
      where: { id: { in: gameIds } },
      select: { id: true, weightOz: true }
    });

    for (const item of cartItems.filter(i => i.type === 'game')) {
      const game = games.find(g => g.id === item.id);
      const weightOz = game?.weightOz || DEFAULT_ITEM_WEIGHT_OZ;
      totalOz += weightOz * item.quantity;
    }
  }

  // Fetch merch weights (stored as string, need to parse)
  if (merchIds.length > 0) {
    const merch = await prisma.merch.findMany({
      where: { id: { in: merchIds } },
      select: { id: true, weight: true }
    });

    for (const item of cartItems.filter(i => i.type === 'merch')) {
      const merchItem = merch.find(m => m.id === item.id);
      // Merch weight is stored as string like "8 oz" or "0.5 lbs"
      const weightOz = parseMerchWeight(merchItem?.weight) || 8; // Default 8 oz for apparel
      totalOz += weightOz * item.quantity;
    }
  }

  // Convert to pounds (minimum 1 lb for shipping)
  const weightLbs = Math.max(1, totalOz / 16);
  return Math.round(weightLbs * 10) / 10; // Round to 1 decimal
}

/**
 * Parse merch weight string to ounces
 */
function parseMerchWeight(weightStr: string | null | undefined): number {
  if (!weightStr) return 8; // Default 8 oz

  const lower = weightStr.toLowerCase();
  const num = parseFloat(weightStr);

  if (isNaN(num)) return 8;

  if (lower.includes('lb') || lower.includes('pound')) {
    return num * 16; // Convert pounds to ounces
  }
  if (lower.includes('oz') || lower.includes('ounce')) {
    return num;
  }

  // Assume ounces if no unit specified
  return num;
}

async function fetchShipStationRates(
  toAddress: ShippingRateRequest['toAddress'],
  weightLbs: number
): Promise<ShippingRate[]> {
  const shipStation = getShipStation();

  const ratesResponse: any = await shipStation.getRates({
    carrierCode: '', // Empty to get rates from all carriers
    fromPostalCode: WAREHOUSE_ZIP,
    toPostalCode: toAddress.postalCode,
    toState: toAddress.state,
    toCity: toAddress.city || '',
    toCountry: toAddress.country || 'US',
    weight: {
      value: weightLbs,
      units: 'pounds',
    },
    dimensions: {
      length: DEFAULT_PACKAGE.length,
      width: DEFAULT_PACKAGE.width,
      height: DEFAULT_PACKAGE.height,
      units: DEFAULT_PACKAGE.units,
    },
    residential: true,
  });

  // Parse ShipStation response
  const ratesArray = Array.isArray(ratesResponse)
    ? ratesResponse
    : (ratesResponse?.rates || []);

  // Filter to just USPS and FedEx, format for frontend
  const rates: ShippingRate[] = ratesArray
    .filter((rate: any) => {
      const carrier = (rate.carrierCode || '').toLowerCase();
      return carrier.includes('usps') ||
             carrier.includes('fedex') ||
             carrier.includes('stamps');
    })
    .map((rate: any) => ({
      carrier: getCarrierDisplayName(rate.carrierCode),
      carrierCode: rate.carrierCode,
      service: rate.serviceName || rate.serviceCode,
      serviceCode: rate.serviceCode,
      priceCents: Math.round((rate.shipmentCost || 0) * 100),
      estimatedDays: rate.deliveryDays || null,
      packageType: rate.packageCode || 'package',
    }))
    .sort((a: ShippingRate, b: ShippingRate) => a.priceCents - b.priceCents);

  return rates;
}

function getCarrierDisplayName(carrierCode: string): string {
  const code = carrierCode.toLowerCase();
  if (code.includes('usps') || code.includes('stamps')) return 'USPS';
  if (code.includes('fedex')) return 'FedEx';
  if (code.includes('ups')) return 'UPS';
  return carrierCode;
}

/**
 * Calculate shipping rates based on weight when ShipStation unavailable
 * Uses realistic USPS/FedEx pricing tiers
 */
function getCalculatedRates(weightLbs: number): ShippingRate[] {
  // USPS Ground Advantage pricing (approximate)
  // Base $4.50 + $0.50 per additional pound
  const uspsGroundBase = 450;
  const uspsGroundPerLb = 50;
  const uspsGroundCents = uspsGroundBase + Math.ceil(weightLbs - 1) * uspsGroundPerLb;

  // USPS Priority Mail pricing (approximate)
  // Base $8.00 + $0.75 per additional pound
  const uspsPriorityBase = 800;
  const uspsPriorityPerLb = 75;
  const uspsPriorityCents = uspsPriorityBase + Math.ceil(weightLbs - 1) * uspsPriorityPerLb;

  // FedEx Ground pricing (approximate)
  // Base $9.00 + $0.60 per additional pound
  const fedexGroundBase = 900;
  const fedexGroundPerLb = 60;
  const fedexGroundCents = fedexGroundBase + Math.ceil(weightLbs - 1) * fedexGroundPerLb;

  // FedEx Express Saver pricing (approximate)
  // Base $15.00 + $1.25 per additional pound
  const fedexExpressBase = 1500;
  const fedexExpressPerLb = 125;
  const fedexExpressCents = fedexExpressBase + Math.ceil(weightLbs - 1) * fedexExpressPerLb;

  return [
    {
      carrier: 'USPS',
      carrierCode: 'usps',
      service: 'Ground Advantage',
      serviceCode: 'usps_ground_advantage',
      priceCents: uspsGroundCents,
      estimatedDays: 5,
      packageType: 'package',
    },
    {
      carrier: 'USPS',
      carrierCode: 'usps',
      service: 'Priority Mail',
      serviceCode: 'usps_priority_mail',
      priceCents: uspsPriorityCents,
      estimatedDays: 3,
      packageType: 'package',
    },
    {
      carrier: 'FedEx',
      carrierCode: 'fedex',
      service: 'Ground',
      serviceCode: 'fedex_ground',
      priceCents: fedexGroundCents,
      estimatedDays: 5,
      packageType: 'package',
    },
    {
      carrier: 'FedEx',
      carrierCode: 'fedex',
      service: 'Express Saver',
      serviceCode: 'fedex_express_saver',
      priceCents: fedexExpressCents,
      estimatedDays: 3,
      packageType: 'package',
    },
  ].sort((a, b) => a.priceCents - b.priceCents);
}
