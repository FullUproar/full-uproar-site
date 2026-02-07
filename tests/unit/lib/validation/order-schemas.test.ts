import {
  createOrderSchema,
  updateOrderSchema,
  refundOrderSchema,
  orderQuerySchema,
  createShippingLabelSchema,
} from '@/lib/validation/order-schemas';

describe('Order Validation Schemas', () => {
  describe('createOrderSchema', () => {
    const validOrder = {
      customerEmail: 'test@example.com',
      customerName: 'John Doe',
      shippingAddress: '123 Main St, Chicago, IL 60601',
      billingAddress: '123 Main St, Chicago, IL 60601',
      totalCents: 2999,
      shippingCents: 599,
      taxCents: 240,
      items: [{
        itemType: 'game' as const,
        gameId: 1,
        quantity: 1,
        priceCents: 2999,
      }],
    };

    it('should accept a valid order', () => {
      const result = createOrderSchema.safeParse(validOrder);
      expect(result.success).toBe(true);
    });

    it('should reject invalid email', () => {
      const result = createOrderSchema.safeParse({
        ...validOrder,
        customerEmail: 'not-an-email',
      });
      expect(result.success).toBe(false);
    });

    it('should reject missing customer name', () => {
      const result = createOrderSchema.safeParse({
        ...validOrder,
        customerName: '',
      });
      expect(result.success).toBe(false);
    });

    it('should reject short shipping address', () => {
      const result = createOrderSchema.safeParse({
        ...validOrder,
        shippingAddress: '123 Main',
      });
      expect(result.success).toBe(false);
    });

    it('should reject empty items array', () => {
      const result = createOrderSchema.safeParse({
        ...validOrder,
        items: [],
      });
      expect(result.success).toBe(false);
    });

    it('should reject negative total', () => {
      const result = createOrderSchema.safeParse({
        ...validOrder,
        totalCents: -100,
      });
      expect(result.success).toBe(false);
    });

    it('should reject negative shipping', () => {
      const result = createOrderSchema.safeParse({
        ...validOrder,
        shippingCents: -1,
      });
      expect(result.success).toBe(false);
    });

    it('should reject game item without gameId', () => {
      const result = createOrderSchema.safeParse({
        ...validOrder,
        items: [{
          itemType: 'game',
          quantity: 1,
          priceCents: 2999,
        }],
      });
      expect(result.success).toBe(false);
    });

    it('should reject merch item without merchId', () => {
      const result = createOrderSchema.safeParse({
        ...validOrder,
        items: [{
          itemType: 'merch',
          quantity: 1,
          priceCents: 1999,
        }],
      });
      expect(result.success).toBe(false);
    });

    it('should accept merch item with merchId and optional size', () => {
      const result = createOrderSchema.safeParse({
        ...validOrder,
        items: [{
          itemType: 'merch',
          merchId: 1,
          merchSize: 'L',
          quantity: 2,
          priceCents: 1999,
        }],
      });
      expect(result.success).toBe(true);
    });

    it('should reject zero quantity', () => {
      const result = createOrderSchema.safeParse({
        ...validOrder,
        items: [{
          itemType: 'game',
          gameId: 1,
          quantity: 0,
          priceCents: 2999,
        }],
      });
      expect(result.success).toBe(false);
    });
  });

  describe('updateOrderSchema', () => {
    it('should accept valid status update', () => {
      const result = updateOrderSchema.safeParse({ status: 'shipped' });
      expect(result.success).toBe(true);
    });

    it('should accept all valid status values', () => {
      const statuses = ['pending', 'paid', 'processing', 'picking', 'packing', 'ready', 'shipped', 'delivered', 'cancelled', 'refunded'];
      for (const status of statuses) {
        const result = updateOrderSchema.safeParse({ status });
        expect(result.success).toBe(true);
      }
    });

    it('should reject invalid status', () => {
      const result = updateOrderSchema.safeParse({ status: 'invalid_status' });
      expect(result.success).toBe(false);
    });

    it('should accept optional tracking number', () => {
      const result = updateOrderSchema.safeParse({
        trackingNumber: '1Z999AA10123456784',
      });
      expect(result.success).toBe(true);
    });

    it('should accept optional notes', () => {
      const result = updateOrderSchema.safeParse({
        notes: 'Customer requested gift wrapping',
      });
      expect(result.success).toBe(true);
    });

    it('should accept empty object (all fields optional)', () => {
      const result = updateOrderSchema.safeParse({});
      expect(result.success).toBe(true);
    });
  });

  describe('refundOrderSchema', () => {
    it('should accept valid refund', () => {
      const result = refundOrderSchema.safeParse({
        amountCents: 1000,
        reason: 'Defective product',
      });
      expect(result.success).toBe(true);
    });

    it('should reject zero amount', () => {
      const result = refundOrderSchema.safeParse({
        amountCents: 0,
        reason: 'Test',
      });
      expect(result.success).toBe(false);
    });

    it('should reject negative amount', () => {
      const result = refundOrderSchema.safeParse({
        amountCents: -100,
        reason: 'Test',
      });
      expect(result.success).toBe(false);
    });

    it('should reject empty reason', () => {
      const result = refundOrderSchema.safeParse({
        amountCents: 1000,
        reason: '',
      });
      expect(result.success).toBe(false);
    });

    it('should reject missing reason', () => {
      const result = refundOrderSchema.safeParse({
        amountCents: 1000,
      });
      expect(result.success).toBe(false);
    });
  });

  describe('orderQuerySchema', () => {
    it('should have correct defaults', () => {
      const result = orderQuerySchema.parse({});
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
    });

    it('should coerce string page to number', () => {
      const result = orderQuerySchema.parse({ page: '3' });
      expect(result.page).toBe(3);
    });

    it('should coerce string limit to number', () => {
      const result = orderQuerySchema.parse({ limit: '50' });
      expect(result.limit).toBe(50);
    });

    it('should reject limit over 100', () => {
      const result = orderQuerySchema.safeParse({ limit: 200 });
      expect(result.success).toBe(false);
    });

    it('should accept optional status filter', () => {
      const result = orderQuerySchema.parse({ status: 'shipped' });
      expect(result.status).toBe('shipped');
    });

    it('should accept optional search', () => {
      const result = orderQuerySchema.parse({ search: 'john' });
      expect(result.search).toBe('john');
    });
  });

  describe('createShippingLabelSchema', () => {
    const validLabel = {
      carrier: 'usps' as const,
      service: 'Priority Mail',
      weight: 2.5,
      length: 12,
      width: 8,
      height: 4,
    };

    it('should accept valid label data', () => {
      const result = createShippingLabelSchema.safeParse(validLabel);
      expect(result.success).toBe(true);
    });

    it('should accept all carrier types', () => {
      for (const carrier of ['usps', 'ups', 'fedex', 'dhl']) {
        const result = createShippingLabelSchema.safeParse({ ...validLabel, carrier });
        expect(result.success).toBe(true);
      }
    });

    it('should reject invalid carrier', () => {
      const result = createShippingLabelSchema.safeParse({
        ...validLabel,
        carrier: 'invalid_carrier',
      });
      expect(result.success).toBe(false);
    });

    it('should reject non-positive weight', () => {
      const result = createShippingLabelSchema.safeParse({
        ...validLabel,
        weight: 0,
      });
      expect(result.success).toBe(false);
    });

    it('should accept optional insurance value', () => {
      const result = createShippingLabelSchema.safeParse({
        ...validLabel,
        insuranceValue: 100,
      });
      expect(result.success).toBe(true);
    });
  });
});
