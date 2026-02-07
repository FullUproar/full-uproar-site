import { parseAddressString, convertOrderToShipStation, isShipStationConfigured } from '@/lib/shipping/shipstation';

describe('ShipStation Address Parser', () => {
  describe('parseAddressString', () => {
    it('should parse 5-part address with apartment', () => {
      const result = parseAddressString('123 Main St, Apt 4, Chicago, IL 60601, US');
      expect(result).toEqual({
        street1: '123 Main St',
        street2: 'Apt 4',
        city: 'Chicago',
        state: 'IL',
        postalCode: '60601',
        country: 'US',
      });
    });

    it('should parse 4-part address without apartment', () => {
      const result = parseAddressString('123 Main St, Chicago, IL 60601, US');
      expect(result).toEqual({
        street1: '123 Main St',
        city: 'Chicago',
        state: 'IL',
        postalCode: '60601',
        country: 'US',
      });
    });

    it('should parse 3-part address and default country to US', () => {
      const result = parseAddressString('123 Main St, Portland, OR 97201');
      expect(result).toEqual({
        street1: '123 Main St',
        city: 'Portland',
        state: 'OR',
        postalCode: '97201',
        country: 'US',
      });
    });

    it('should handle 2-part fallback (entire string as street1)', () => {
      // With only 2 comma-separated parts, parser can't distinguish city/state/zip
      // so the whole string becomes street1
      const result = parseAddressString('123 Main St, SomeCity');
      expect(result.street1).toBe('123 Main St, SomeCity');
      expect(result.city).toBe('');
      expect(result.country).toBe('US');
    });

    it('should handle single-part fallback', () => {
      const result = parseAddressString('just a random string');
      expect(result.street1).toBe('just a random string');
      expect(result.city).toBe('');
      expect(result.state).toBe('');
      expect(result.postalCode).toBe('');
      expect(result.country).toBe('US');
    });

    it('should trim whitespace from parts', () => {
      const result = parseAddressString('  123 Main St ,  Chicago ,  IL 60601 ,  US  ');
      expect(result.street1).toBe('123 Main St');
      expect(result.city).toBe('Chicago');
      expect(result.state).toBe('IL');
      expect(result.country).toBe('US');
    });

    it('should handle suite-style address', () => {
      const result = parseAddressString('100 Corporate Dr, Suite 200, Dallas, TX 75201, US');
      expect(result.street1).toBe('100 Corporate Dr');
      expect(result.street2).toBe('Suite 200');
      expect(result.city).toBe('Dallas');
      expect(result.state).toBe('TX');
      expect(result.postalCode).toBe('75201');
    });
  });

  describe('convertOrderToShipStation', () => {
    const mockOrder = {
      id: 'order-123',
      createdAt: '2025-01-15T12:00:00Z',
      status: 'paid',
      customerEmail: 'test@example.com',
      customerName: 'John Doe',
      customerPhone: '555-1234',
      shippingAddress: '123 Main St, Chicago, IL 60601, US',
      billingAddress: '456 Billing Ave, New York, NY 10001, US',
      totalCents: 5999,
      taxCents: 480,
      shippingCents: 599,
      items: [
        {
          id: 1,
          game: { title: 'Epic Board Game', slug: 'epic-board-game' },
          merch: null,
          merchSize: null,
          quantity: 1,
          priceCents: 2999,
        },
        {
          id: 2,
          game: null,
          merch: { name: 'Logo T-Shirt', slug: 'logo-tshirt' },
          merchSize: 'L',
          quantity: 2,
          priceCents: 1500,
        },
      ],
    };

    it('should convert order to ShipStation format', () => {
      const result = convertOrderToShipStation(mockOrder);

      expect(result.orderNumber).toBe('order-123');
      expect(result.orderStatus).toBe('awaiting_shipment');
      expect(result.customerEmail).toBe('test@example.com');
      expect(result.customerUsername).toBe('John Doe');
    });

    it('should map paid status to awaiting_shipment', () => {
      const result = convertOrderToShipStation(mockOrder);
      expect(result.orderStatus).toBe('awaiting_shipment');
    });

    it('should map non-paid status to awaiting_payment', () => {
      const result = convertOrderToShipStation({ ...mockOrder, status: 'pending' });
      expect(result.orderStatus).toBe('awaiting_payment');
    });

    it('should parse shipping address correctly', () => {
      const result = convertOrderToShipStation(mockOrder);
      expect(result.shipTo.street1).toBe('123 Main St');
      expect(result.shipTo.city).toBe('Chicago');
      expect(result.shipTo.state).toBe('IL');
      expect(result.shipTo.postalCode).toBe('60601');
      expect(result.shipTo.residential).toBe(true);
    });

    it('should parse billing address separately', () => {
      const result = convertOrderToShipStation(mockOrder);
      expect(result.billTo.street1).toBe('456 Billing Ave');
      expect(result.billTo.city).toBe('New York');
      expect(result.billTo.state).toBe('NY');
    });

    it('should fall back to shipping address for billing when not provided', () => {
      const result = convertOrderToShipStation({ ...mockOrder, billingAddress: null });
      expect(result.billTo.street1).toBe('123 Main St');
      expect(result.billTo.city).toBe('Chicago');
    });

    it('should convert item prices from cents to dollars', () => {
      const result = convertOrderToShipStation(mockOrder);
      expect(result.items[0].unitPrice).toBe(29.99);
      expect(result.items[1].unitPrice).toBe(15.00);
    });

    it('should map game titles and merch names', () => {
      const result = convertOrderToShipStation(mockOrder);
      expect(result.items[0].name).toBe('Epic Board Game');
      expect(result.items[0].sku).toBe('epic-board-game');
      expect(result.items[1].name).toBe('Logo T-Shirt');
      expect(result.items[1].sku).toBe('logo-tshirt');
    });

    it('should include size option for merch items', () => {
      const result = convertOrderToShipStation(mockOrder);
      expect(result.items[1].options).toEqual([{ name: 'Size', value: 'L' }]);
    });

    it('should not include size option for game items', () => {
      const result = convertOrderToShipStation(mockOrder);
      expect(result.items[0].options).toEqual([]);
    });

    it('should convert monetary amounts from cents to dollars', () => {
      const result = convertOrderToShipStation(mockOrder);
      expect(result.amountPaid).toBe(59.99);
      expect(result.taxAmount).toBe(4.80);
      expect(result.shippingAmount).toBe(5.99);
    });

    it('should set payment method and source', () => {
      const result = convertOrderToShipStation(mockOrder);
      expect(result.paymentMethod).toBe('Stripe');
      expect(result.advancedOptions?.source).toBe('Full Uproar');
      expect(result.advancedOptions?.customField1).toBe('order-123');
    });

    it('should handle orders with no items', () => {
      const result = convertOrderToShipStation({ ...mockOrder, items: null });
      expect(result.items).toEqual([]);
    });

    it('should use "Product" as fallback name when no game or merch', () => {
      const result = convertOrderToShipStation({
        ...mockOrder,
        items: [{ id: 1, game: null, merch: null, merchSize: null, quantity: 1, priceCents: 100 }],
      });
      expect(result.items[0].name).toBe('Product');
    });
  });

  describe('isShipStationConfigured', () => {
    const originalEnv = process.env;

    beforeEach(() => {
      process.env = { ...originalEnv };
    });

    afterEach(() => {
      process.env = originalEnv;
    });

    it('should return true when both env vars are set', () => {
      process.env.SHIPSTATION_API_KEY = 'test-key';
      process.env.SHIPSTATION_API_SECRET = 'test-secret';
      expect(isShipStationConfigured()).toBe(true);
    });

    it('should return false when API key is missing', () => {
      delete process.env.SHIPSTATION_API_KEY;
      process.env.SHIPSTATION_API_SECRET = 'test-secret';
      expect(isShipStationConfigured()).toBe(false);
    });

    it('should return false when API secret is missing', () => {
      process.env.SHIPSTATION_API_KEY = 'test-key';
      delete process.env.SHIPSTATION_API_SECRET;
      expect(isShipStationConfigured()).toBe(false);
    });

    it('should return false when both are missing', () => {
      delete process.env.SHIPSTATION_API_KEY;
      delete process.env.SHIPSTATION_API_SECRET;
      expect(isShipStationConfigured()).toBe(false);
    });
  });
});
