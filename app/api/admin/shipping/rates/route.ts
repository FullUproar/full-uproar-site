import { NextRequest, NextResponse } from 'next/server';
import { getShipStation } from '@/lib/shipping/shipstation';
import { requirePermission } from '@/lib/permissions';

export async function POST(request: NextRequest) {
  try {
    // Check admin permissions
    await requirePermission(request, 'manage_orders');

    const body = await request.json();
    const { weight, dimensions, toAddress, fromZip } = body;

    const shipStation = getShipStation();

    // Get rates from multiple carriers
    const carriers = ['fedex', 'ups', 'usps'];
    const allRates = [];

    for (const carrierCode of carriers) {
      try {
        const rates = await shipStation.getRates({
          carrierCode,
          fromPostalCode: fromZip || process.env.WAREHOUSE_ZIP || '10001',
          toCountry: toAddress.country || 'US',
          toState: toAddress.state,
          toPostalCode: toAddress.postalCode,
          toCity: toAddress.city,
          weight: {
            value: weight || 1,
            units: 'pounds',
          },
          dimensions: dimensions ? {
            length: dimensions.length,
            width: dimensions.width,
            height: dimensions.height,
            units: 'inches',
          } : undefined,
          residential: toAddress.residential \!== false,
        });

        allRates.push(...rates.map(rate => ({
          ...rate,
          carrier: carrierCode,
        })));
      } catch (error) {
        console.error(`Failed to get rates from ${carrierCode}:`, error);
      }
    }

    // Sort by price
    allRates.sort((a, b) => a.shipmentCost - b.shipmentCost);

    return NextResponse.json({
      success: true,
      rates: allRates,
    });
  } catch (error: any) {
    console.error('Get shipping rates error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
EOF < /dev/null
