import { NextRequest, NextResponse } from 'next/server';
import { calculateTax, TaxCalculationInput } from '@/lib/tax';

export async function POST(request: NextRequest) {
  try {
    const body: TaxCalculationInput = await request.json();

    const { subtotalCents, shippingCents } = body;

    if (typeof subtotalCents !== 'number' || typeof shippingCents !== 'number') {
      return NextResponse.json(
        { error: 'subtotalCents and shippingCents are required numbers' },
        { status: 400 }
      );
    }

    const result = await calculateTax(body);
    return NextResponse.json(result);

  } catch (error) {
    console.error('Tax calculation error:', error);
    return NextResponse.json(
      { error: 'Failed to calculate tax' },
      { status: 500 }
    );
  }
}
