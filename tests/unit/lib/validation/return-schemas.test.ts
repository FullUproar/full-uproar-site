import {
  createReturnSchema,
  updateReturnSchema,
  returnQuerySchema,
} from '@/lib/validation/return-schemas';

describe('Return Validation Schemas', () => {
  describe('createReturnSchema', () => {
    const validReturn = {
      orderId: '550e8400-e29b-41d4-a716-446655440000',
      reason: 'defective' as const,
      items: [{
        orderItemId: 1,
        quantity: 1,
        condition: 'like_new' as const,
      }],
    };

    it('should accept a valid return request', () => {
      const result = createReturnSchema.safeParse(validReturn);
      expect(result.success).toBe(true);
    });

    it('should reject invalid UUID for orderId', () => {
      const result = createReturnSchema.safeParse({
        ...validReturn,
        orderId: 'not-a-uuid',
      });
      expect(result.success).toBe(false);
    });

    it('should accept all reason types', () => {
      const reasons = ['defective', 'wrong_item', 'not_as_described', 'no_longer_needed', 'better_price', 'other'];
      for (const reason of reasons) {
        const result = createReturnSchema.safeParse({ ...validReturn, reason });
        expect(result.success).toBe(true);
      }
    });

    it('should reject invalid reason', () => {
      const result = createReturnSchema.safeParse({
        ...validReturn,
        reason: 'invalid_reason',
      });
      expect(result.success).toBe(false);
    });

    it('should require at least one item', () => {
      const result = createReturnSchema.safeParse({
        ...validReturn,
        items: [],
      });
      expect(result.success).toBe(false);
    });

    it('should accept all condition types', () => {
      const conditions = ['unopened', 'like_new', 'used', 'damaged'];
      for (const condition of conditions) {
        const result = createReturnSchema.safeParse({
          ...validReturn,
          items: [{ orderItemId: 1, quantity: 1, condition }],
        });
        expect(result.success).toBe(true);
      }
    });

    it('should reject zero quantity', () => {
      const result = createReturnSchema.safeParse({
        ...validReturn,
        items: [{ orderItemId: 1, quantity: 0 }],
      });
      expect(result.success).toBe(false);
    });

    it('should accept optional customer notes', () => {
      const result = createReturnSchema.safeParse({
        ...validReturn,
        customerNotes: 'Item arrived damaged',
      });
      expect(result.success).toBe(true);
    });

    it('should accept optional autoApprove flag', () => {
      const result = createReturnSchema.safeParse({
        ...validReturn,
        autoApprove: true,
      });
      expect(result.success).toBe(true);
    });
  });

  describe('updateReturnSchema', () => {
    it('should accept all valid status values', () => {
      const statuses = ['requested', 'approved', 'rejected', 'shipping', 'received', 'processing', 'completed', 'cancelled'];
      for (const status of statuses) {
        const result = updateReturnSchema.safeParse({ status });
        expect(result.success).toBe(true);
      }
    });

    it('should reject invalid status', () => {
      const result = updateReturnSchema.safeParse({ status: 'invalid' });
      expect(result.success).toBe(false);
    });

    it('should accept optional refund amount', () => {
      const result = updateReturnSchema.safeParse({ refundAmountCents: 1500 });
      expect(result.success).toBe(true);
    });

    it('should reject negative refund amount', () => {
      const result = updateReturnSchema.safeParse({ refundAmountCents: -100 });
      expect(result.success).toBe(false);
    });

    it('should accept zero refund amount', () => {
      const result = updateReturnSchema.safeParse({ refundAmountCents: 0 });
      expect(result.success).toBe(true);
    });

    it('should accept optional processRefund', () => {
      const result = updateReturnSchema.safeParse({ processRefund: true });
      expect(result.success).toBe(true);
    });

    it('should accept empty object', () => {
      const result = updateReturnSchema.safeParse({});
      expect(result.success).toBe(true);
    });
  });

  describe('returnQuerySchema', () => {
    it('should have correct defaults', () => {
      const result = returnQuerySchema.parse({});
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
    });

    it('should accept optional orderId filter', () => {
      const result = returnQuerySchema.parse({
        orderId: '550e8400-e29b-41d4-a716-446655440000',
      });
      expect(result.orderId).toBe('550e8400-e29b-41d4-a716-446655440000');
    });

    it('should reject invalid orderId UUID', () => {
      const result = returnQuerySchema.safeParse({
        orderId: 'not-a-uuid',
      });
      expect(result.success).toBe(false);
    });

    it('should reject limit over 100', () => {
      const result = returnQuerySchema.safeParse({ limit: 200 });
      expect(result.success).toBe(false);
    });

    it('should coerce string page to number', () => {
      const result = returnQuerySchema.parse({ page: '2' });
      expect(result.page).toBe(2);
    });
  });
});
