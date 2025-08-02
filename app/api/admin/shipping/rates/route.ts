import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth';
import { ShippingService } from '@/lib/shipping/shipping-service';

export async function POST(request: NextRequest) {
  try {
    // Check admin permission
    await requirePermission('admin:access');

    const { 
      fromAddress,
      toAddress,
      packageDetails
    } = await request.json();

    // Validate addresses
    if (!toAddress || !toAddress.zip) {
      return NextResponse.json(
        { error: 'Destination address is required' },
        { status: 400 }
      );
    }

    // Default from address
    const from = fromAddress || {
      name: 'Full Uproar Games',
      street1: '123 Chaos Street',
      city: 'Game City',
      state: 'CA',
      zip: '90210',
      country: 'US'
    };

    // Default package if not provided
    const pkg = packageDetails || {
      weight: 16, // 1 pound default
      length: 12,
      width: 9,
      height: 3,
      value: 5000 // $50 default
    };

    // Get rates from all carriers
    const rates = await ShippingService.getAllRates(from, toAddress, pkg);

    // Group by carrier
    const groupedRates = rates.reduce((acc, rate) => {
      if (!acc[rate.carrier]) {
        acc[rate.carrier] = [];
      }
      acc[rate.carrier].push(rate);
      return acc;
    }, {} as Record<string, typeof rates>);

    return NextResponse.json({
      rates,
      groupedRates,
      cheapest: rates[0],
      fastest: rates.reduce((fastest, rate) => 
        rate.deliveryDays < fastest.deliveryDays ? rate : fastest
      )
    });
  } catch (error: any) {
    console.error('Error fetching shipping rates:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch shipping rates' },
      { status: 500 }
    );
  }
}