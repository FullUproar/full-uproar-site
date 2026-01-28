import { stripe } from '@/lib/stripe';

// Tax calculation configuration
// TODO: Enable Stripe Tax once registered for tax collection
export const USE_STRIPE_TAX = false;

// Default tax rate when Stripe Tax is not enabled
// This is a placeholder - real tax varies by location (0% to 10%+)
export const DEFAULT_TAX_RATE = 0.08; // 8%

// States that don't charge sales tax
export const NO_TAX_STATES = ['DE', 'MT', 'NH', 'OR'];

// States that tax shipping (most do, these are the confirmed ones)
export const SHIPPING_TAX_STATES = [
  'AR', 'CT', 'GA', 'HI', 'IL', 'KS', 'KY', 'MI', 'MN', 'MS',
  'NE', 'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'PA', 'SC', 'SD',
  'TN', 'TX', 'VT', 'WA', 'WV', 'WI', 'WY'
];

export interface TaxCalculationInput {
  subtotalCents: number;
  shippingCents: number;
  shippingAddress?: {
    state?: string;
    zipCode?: string;
    city?: string;
    country?: string;
  };
}

export interface TaxCalculationResult {
  taxCents: number;
  taxRate: number;
  taxableAmountCents: number;
  isEstimate: boolean;
  breakdown?: {
    subtotalTaxCents: number;
    shippingTaxCents: number;
  };
}

/**
 * Calculate tax for an order
 * Uses Stripe Tax if enabled and configured, otherwise falls back to default calculation
 */
export async function calculateTax(input: TaxCalculationInput): Promise<TaxCalculationResult> {
  const { subtotalCents, shippingCents, shippingAddress } = input;

  // If Stripe Tax is enabled and configured, use it
  if (USE_STRIPE_TAX && stripe && shippingAddress?.zipCode) {
    try {
      return await calculateWithStripeTax(subtotalCents, shippingCents, shippingAddress);
    } catch (stripeTaxError) {
      console.error('Stripe Tax calculation failed, falling back to default:', stripeTaxError);
      // Fall through to default calculation
    }
  }

  // Default tax calculation
  return calculateDefaultTax(subtotalCents, shippingCents, shippingAddress);
}

/**
 * Simple synchronous tax calculation (for cases where async isn't practical)
 * Always uses default rates, not Stripe Tax
 */
export function calculateTaxSync(input: TaxCalculationInput): TaxCalculationResult {
  return calculateDefaultTax(input.subtotalCents, input.shippingCents, input.shippingAddress);
}

function calculateDefaultTax(
  subtotalCents: number,
  shippingCents: number,
  shippingAddress?: TaxCalculationInput['shippingAddress']
): TaxCalculationResult {
  const state = shippingAddress?.state?.toUpperCase();

  // No tax for tax-free states
  if (state && NO_TAX_STATES.includes(state)) {
    return {
      taxCents: 0,
      taxRate: 0,
      taxableAmountCents: 0,
      isEstimate: true,
      breakdown: {
        subtotalTaxCents: 0,
        shippingTaxCents: 0
      }
    };
  }

  // Determine if shipping should be taxed (default to yes if state unknown)
  const taxShipping = state ? SHIPPING_TAX_STATES.includes(state) : true;

  // Calculate tax
  const taxableSubtotal = subtotalCents;
  const taxableShipping = taxShipping ? shippingCents : 0;
  const taxableAmountCents = taxableSubtotal + taxableShipping;

  const subtotalTaxCents = Math.round(taxableSubtotal * DEFAULT_TAX_RATE);
  const shippingTaxCents = Math.round(taxableShipping * DEFAULT_TAX_RATE);
  const taxCents = subtotalTaxCents + shippingTaxCents;

  return {
    taxCents,
    taxRate: DEFAULT_TAX_RATE,
    taxableAmountCents,
    isEstimate: true, // Always true until Stripe Tax is enabled
    breakdown: {
      subtotalTaxCents,
      shippingTaxCents
    }
  };
}

async function calculateWithStripeTax(
  subtotalCents: number,
  shippingCents: number,
  shippingAddress: NonNullable<TaxCalculationInput['shippingAddress']>
): Promise<TaxCalculationResult> {
  // Stripe Tax Calculation API
  // Documentation: https://stripe.com/docs/tax/custom
  //
  // Prerequisites for Stripe Tax:
  // 1. Enable Tax in Stripe Dashboard (Settings > Tax)
  // 2. Register your business locations where you have tax nexus
  // 3. Configure tax categories for your products
  //
  // Note: This will be enabled once the store launches and tax registration is complete

  if (!stripe) {
    throw new Error('Stripe not configured');
  }

  // Create a tax calculation
  const calculation = await stripe.tax.calculations.create({
    currency: 'usd',
    customer_details: {
      address: {
        postal_code: shippingAddress.zipCode || '',
        state: shippingAddress.state || '',
        city: shippingAddress.city || '',
        country: shippingAddress.country || 'US',
        line1: '', // Not needed for tax calculation
      },
      address_source: 'shipping',
    },
    line_items: [
      {
        amount: subtotalCents,
        reference: 'products',
        tax_behavior: 'exclusive',
        tax_code: 'txcd_99999999', // General tangible goods
      },
      ...(shippingCents > 0 ? [{
        amount: shippingCents,
        reference: 'shipping',
        tax_behavior: 'exclusive' as const,
        tax_code: 'txcd_92010001', // Shipping
      }] : []),
    ],
    shipping_cost: shippingCents > 0 ? {
      amount: shippingCents,
      tax_behavior: 'exclusive',
      tax_code: 'txcd_92010001',
    } : undefined,
  });

  // Extract tax amounts
  const productLine = calculation.line_items?.data.find(li => li.reference === 'products');
  const shippingLine = calculation.line_items?.data.find(li => li.reference === 'shipping');

  const subtotalTaxCents = productLine?.amount_tax || 0;
  const shippingTaxCents = shippingLine?.amount_tax || (calculation.shipping_cost?.amount_tax || 0);

  return {
    taxCents: calculation.tax_amount_exclusive,
    taxRate: (subtotalCents + shippingCents) > 0
      ? calculation.tax_amount_exclusive / (subtotalCents + shippingCents)
      : 0,
    taxableAmountCents: subtotalCents + shippingCents,
    isEstimate: false,
    breakdown: {
      subtotalTaxCents,
      shippingTaxCents
    }
  };
}
