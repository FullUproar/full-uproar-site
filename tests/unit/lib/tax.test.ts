// Mock the stripe import before importing tax module
jest.mock('@/lib/stripe', () => ({
  stripe: null,
}));

import {
  calculateTaxSync,
  calculateTax,
  DEFAULT_TAX_RATE,
  NO_TAX_STATES,
  SHIPPING_TAX_STATES,
  USE_STRIPE_TAX,
} from '@/lib/tax';

describe('Tax Calculation', () => {
  describe('Constants', () => {
    it('should have default tax rate of 8%', () => {
      expect(DEFAULT_TAX_RATE).toBe(0.08);
    });

    it('should have no-tax states', () => {
      expect(NO_TAX_STATES).toContain('DE');
      expect(NO_TAX_STATES).toContain('MT');
      expect(NO_TAX_STATES).toContain('NH');
      expect(NO_TAX_STATES).toContain('OR');
      expect(NO_TAX_STATES).toHaveLength(4);
    });

    it('should have shipping-tax states including TX and NY', () => {
      expect(SHIPPING_TAX_STATES).toContain('TX');
      expect(SHIPPING_TAX_STATES).toContain('NY');
      expect(SHIPPING_TAX_STATES).toContain('PA');
      expect(SHIPPING_TAX_STATES).toContain('WA');
    });

    it('should have Stripe Tax disabled', () => {
      expect(USE_STRIPE_TAX).toBe(false);
    });
  });

  describe('calculateTaxSync', () => {
    it('should return zero tax for no-tax states', () => {
      for (const state of NO_TAX_STATES) {
        const result = calculateTaxSync({
          subtotalCents: 10000,
          shippingCents: 500,
          shippingAddress: { state },
        });

        expect(result.taxCents).toBe(0);
        expect(result.taxRate).toBe(0);
        expect(result.taxableAmountCents).toBe(0);
        expect(result.breakdown?.subtotalTaxCents).toBe(0);
        expect(result.breakdown?.shippingTaxCents).toBe(0);
      }
    });

    it('should handle case-insensitive state codes for no-tax states', () => {
      const result = calculateTaxSync({
        subtotalCents: 10000,
        shippingCents: 500,
        shippingAddress: { state: 'or' },
      });
      expect(result.taxCents).toBe(0);
    });

    it('should tax both subtotal and shipping for shipping-tax states', () => {
      const result = calculateTaxSync({
        subtotalCents: 10000,
        shippingCents: 500,
        shippingAddress: { state: 'TX' },
      });

      expect(result.taxRate).toBe(DEFAULT_TAX_RATE);
      expect(result.taxableAmountCents).toBe(10500);
      expect(result.breakdown?.subtotalTaxCents).toBe(Math.round(10000 * 0.08));
      expect(result.breakdown?.shippingTaxCents).toBe(Math.round(500 * 0.08));
      expect(result.taxCents).toBe(800 + 40); // 840
    });

    it('should tax only subtotal for non-shipping-tax states', () => {
      // CA is NOT in SHIPPING_TAX_STATES
      const result = calculateTaxSync({
        subtotalCents: 10000,
        shippingCents: 500,
        shippingAddress: { state: 'CA' },
      });

      expect(result.taxRate).toBe(DEFAULT_TAX_RATE);
      expect(result.taxableAmountCents).toBe(10000); // No shipping in taxable
      expect(result.breakdown?.subtotalTaxCents).toBe(800);
      expect(result.breakdown?.shippingTaxCents).toBe(0);
      expect(result.taxCents).toBe(800);
    });

    it('should default to taxing shipping when no address provided', () => {
      const result = calculateTaxSync({
        subtotalCents: 10000,
        shippingCents: 500,
      });

      expect(result.taxRate).toBe(DEFAULT_TAX_RATE);
      expect(result.taxableAmountCents).toBe(10500);
      expect(result.breakdown?.shippingTaxCents).toBe(40);
      expect(result.taxCents).toBe(840);
    });

    it('should default to taxing shipping when state is unknown', () => {
      const result = calculateTaxSync({
        subtotalCents: 10000,
        shippingCents: 500,
        shippingAddress: {},
      });

      expect(result.taxableAmountCents).toBe(10500);
      expect(result.breakdown?.shippingTaxCents).toBe(40);
    });

    it('should always mark result as estimate', () => {
      const result = calculateTaxSync({
        subtotalCents: 10000,
        shippingCents: 0,
        shippingAddress: { state: 'TX' },
      });
      expect(result.isEstimate).toBe(true);
    });

    it('should handle zero subtotal', () => {
      const result = calculateTaxSync({
        subtotalCents: 0,
        shippingCents: 500,
        shippingAddress: { state: 'TX' },
      });

      expect(result.breakdown?.subtotalTaxCents).toBe(0);
      expect(result.breakdown?.shippingTaxCents).toBe(40);
      expect(result.taxCents).toBe(40);
    });

    it('should handle zero shipping', () => {
      const result = calculateTaxSync({
        subtotalCents: 10000,
        shippingCents: 0,
        shippingAddress: { state: 'TX' },
      });

      expect(result.breakdown?.subtotalTaxCents).toBe(800);
      expect(result.breakdown?.shippingTaxCents).toBe(0);
      expect(result.taxCents).toBe(800);
    });

    it('should round tax cents correctly', () => {
      // 333 * 0.08 = 26.64, should round to 27
      const result = calculateTaxSync({
        subtotalCents: 333,
        shippingCents: 0,
        shippingAddress: { state: 'CA' },
      });
      expect(result.breakdown?.subtotalTaxCents).toBe(27);
    });
  });

  describe('calculateTax (async)', () => {
    it('should fall back to default calculation when Stripe Tax is disabled', async () => {
      const result = await calculateTax({
        subtotalCents: 10000,
        shippingCents: 500,
        shippingAddress: { state: 'TX' },
      });

      expect(result.taxCents).toBe(840);
      expect(result.isEstimate).toBe(true);
    });

    it('should match calculateTaxSync results', async () => {
      const input = {
        subtotalCents: 5000,
        shippingCents: 1000,
        shippingAddress: { state: 'NY' },
      };

      const syncResult = calculateTaxSync(input);
      const asyncResult = await calculateTax(input);

      expect(asyncResult).toEqual(syncResult);
    });
  });
});
