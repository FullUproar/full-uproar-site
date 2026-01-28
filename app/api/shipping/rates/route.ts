import { NextRequest, NextResponse } from 'next/server';
import { getShipStation, isShipStationConfigured } from '@/lib/shipping/shipstation';

/**
 * Public Shipping Rates API
 *
 * Fetches available shipping rates from ShipStation based on destination address
 * and package weight. Used during checkout for customers to select shipping method.
 */

// Default package dimensions for board games/merch
const DEFAULT_PACKAGE = {
  weight: 2, // pounds
  length: 12,
  width: 9,
  height: 3,
  units: 'inches' as const,
};

// Warehouse/origin address - should match your ShipStation warehouse
const WAREHOUSE_ZIP = process.env.WAREHOUSE_ZIP || '10001';

interface ShippingRateRequest {
  toAddress: {
    street?: string;
    city: string;
    state: string;
    postalCode: string;
    country?: string;
  };
  weight?: number; // pounds
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
    const { toAddress, weight } = body;

    if (!toAddress?.postalCode || !toAddress?.state) {
      return NextResponse.json(
        { error: 'Postal code and state are required' },
        { status: 400 }
      );
    }

    // If ShipStation is configured, get real rates
    if (isShipStationConfigured()) {
      try {
        const rates = await fetchShipStationRates(toAddress, weight);
        if (rates.length > 0) {
          return NextResponse.json({ rates, source: 'shipstation' });
        }
      } catch (error) {
        console.error('ShipStation rate fetch failed:', error);
        // Fall through to default rates
      }
    }

    // Fallback to default flat rates
    const defaultRates = getDefaultRates();
    return NextResponse.json({ rates: defaultRates, source: 'default' });

  } catch (error) {
    console.error('Shipping rates error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch shipping rates' },
      { status: 500 }
    );
  }
}

async function fetchShipStationRates(
  toAddress: ShippingRateRequest['toAddress'],
  weight?: number
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
      value: weight || DEFAULT_PACKAGE.weight,
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

function getDefaultRates(): ShippingRate[] {
  // Default flat rates when ShipStation isn't configured
  return [
    {
      carrier: 'USPS',
      carrierCode: 'usps',
      service: 'Priority Mail',
      serviceCode: 'usps_priority_mail',
      priceCents: 899,
      estimatedDays: 3,
      packageType: 'package',
    },
    {
      carrier: 'USPS',
      carrierCode: 'usps',
      service: 'Ground Advantage',
      serviceCode: 'usps_ground_advantage',
      priceCents: 599,
      estimatedDays: 5,
      packageType: 'package',
    },
    {
      carrier: 'FedEx',
      carrierCode: 'fedex',
      service: 'Ground',
      serviceCode: 'fedex_ground',
      priceCents: 999,
      estimatedDays: 5,
      packageType: 'package',
    },
    {
      carrier: 'FedEx',
      carrierCode: 'fedex',
      service: 'Express Saver',
      serviceCode: 'fedex_express_saver',
      priceCents: 1599,
      estimatedDays: 3,
      packageType: 'package',
    },
  ];
}
