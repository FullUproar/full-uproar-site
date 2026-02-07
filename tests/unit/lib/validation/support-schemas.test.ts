import {
  createTicketSchema,
  updateTicketSchema,
  createMessageSchema,
  ticketQuerySchema,
} from '@/lib/validation/support-schemas';

describe('Support Validation Schemas', () => {
  describe('createTicketSchema', () => {
    const validTicket = {
      customerName: 'John Doe',
      customerEmail: 'john@example.com',
      category: 'order_issue' as const,
      subject: 'Missing item in order',
      message: 'I ordered 3 items but only received 2.',
    };

    it('should accept a valid ticket', () => {
      const result = createTicketSchema.safeParse(validTicket);
      expect(result.success).toBe(true);
    });

    it('should default priority to normal', () => {
      const result = createTicketSchema.parse(validTicket);
      expect(result.priority).toBe('normal');
    });

    it('should accept all category types', () => {
      const categories = ['order_issue', 'payment_issue', 'shipping', 'product_question', 'return_refund', 'technical', 'other'];
      for (const category of categories) {
        const result = createTicketSchema.safeParse({ ...validTicket, category });
        expect(result.success).toBe(true);
      }
    });

    it('should reject invalid category', () => {
      const result = createTicketSchema.safeParse({
        ...validTicket,
        category: 'invalid_category',
      });
      expect(result.success).toBe(false);
    });

    it('should accept all priority levels', () => {
      const priorities = ['low', 'normal', 'high', 'urgent'];
      for (const priority of priorities) {
        const result = createTicketSchema.safeParse({ ...validTicket, priority });
        expect(result.success).toBe(true);
      }
    });

    it('should reject missing customer name', () => {
      const result = createTicketSchema.safeParse({
        ...validTicket,
        customerName: '',
      });
      expect(result.success).toBe(false);
    });

    it('should reject invalid email', () => {
      const result = createTicketSchema.safeParse({
        ...validTicket,
        customerEmail: 'not-an-email',
      });
      expect(result.success).toBe(false);
    });

    it('should reject missing subject', () => {
      const result = createTicketSchema.safeParse({
        ...validTicket,
        subject: '',
      });
      expect(result.success).toBe(false);
    });

    it('should reject subject over 200 chars', () => {
      const result = createTicketSchema.safeParse({
        ...validTicket,
        subject: 'x'.repeat(201),
      });
      expect(result.success).toBe(false);
    });

    it('should reject missing message', () => {
      const result = createTicketSchema.safeParse({
        ...validTicket,
        message: '',
      });
      expect(result.success).toBe(false);
    });

    it('should reject message over 5000 chars', () => {
      const result = createTicketSchema.safeParse({
        ...validTicket,
        message: 'x'.repeat(5001),
      });
      expect(result.success).toBe(false);
    });

    it('should accept optional orderId', () => {
      const result = createTicketSchema.safeParse({
        ...validTicket,
        orderId: '550e8400-e29b-41d4-a716-446655440000',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('updateTicketSchema', () => {
    it('should accept all status values', () => {
      const statuses = ['open', 'in_progress', 'waiting_customer', 'resolved', 'closed'];
      for (const status of statuses) {
        const result = updateTicketSchema.safeParse({ status });
        expect(result.success).toBe(true);
      }
    });

    it('should reject invalid status', () => {
      const result = updateTicketSchema.safeParse({ status: 'invalid' });
      expect(result.success).toBe(false);
    });

    it('should accept all priority values', () => {
      const priorities = ['low', 'normal', 'high', 'urgent'];
      for (const priority of priorities) {
        const result = updateTicketSchema.safeParse({ priority });
        expect(result.success).toBe(true);
      }
    });

    it('should accept nullable assignedToId', () => {
      const result = updateTicketSchema.safeParse({ assignedToId: null });
      expect(result.success).toBe(true);
    });

    it('should accept resolution text', () => {
      const result = updateTicketSchema.safeParse({
        resolution: 'Issued full refund and replacement.',
      });
      expect(result.success).toBe(true);
    });

    it('should accept empty object (all optional)', () => {
      const result = updateTicketSchema.safeParse({});
      expect(result.success).toBe(true);
    });
  });

  describe('createMessageSchema', () => {
    it('should accept valid message', () => {
      const result = createMessageSchema.safeParse({
        message: 'Thank you for your patience.',
      });
      expect(result.success).toBe(true);
    });

    it('should default isInternal to false', () => {
      const result = createMessageSchema.parse({
        message: 'Public reply',
      });
      expect(result.isInternal).toBe(false);
    });

    it('should accept internal messages', () => {
      const result = createMessageSchema.safeParse({
        message: 'Internal note: escalate to manager',
        isInternal: true,
      });
      expect(result.success).toBe(true);
    });

    it('should reject empty message', () => {
      const result = createMessageSchema.safeParse({
        message: '',
      });
      expect(result.success).toBe(false);
    });

    it('should reject message over 5000 chars', () => {
      const result = createMessageSchema.safeParse({
        message: 'x'.repeat(5001),
      });
      expect(result.success).toBe(false);
    });
  });

  describe('ticketQuerySchema', () => {
    it('should have correct defaults', () => {
      const result = ticketQuerySchema.parse({});
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
    });

    it('should accept optional filters', () => {
      const result = ticketQuerySchema.parse({
        status: 'open',
        priority: 'high',
        category: 'shipping',
        search: 'refund',
      });
      expect(result.status).toBe('open');
      expect(result.priority).toBe('high');
      expect(result.category).toBe('shipping');
      expect(result.search).toBe('refund');
    });

    it('should reject limit over 100', () => {
      const result = ticketQuerySchema.safeParse({ limit: 200 });
      expect(result.success).toBe(false);
    });

    it('should reject search over 100 chars', () => {
      const result = ticketQuerySchema.safeParse({
        search: 'x'.repeat(101),
      });
      expect(result.success).toBe(false);
    });

    it('should coerce string pagination values', () => {
      const result = ticketQuerySchema.parse({ page: '5', limit: '50' });
      expect(result.page).toBe(5);
      expect(result.limit).toBe(50);
    });
  });
});
