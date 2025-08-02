import { z } from 'zod';

// Return creation schema
export const createReturnSchema = z.object({
  orderId: z.string().uuid('Invalid order ID'),
  reason: z.enum([
    'defective', 'wrong_item', 'not_as_described', 
    'no_longer_needed', 'better_price', 'other'
  ]),
  customerNotes: z.string().max(1000).optional(),
  items: z.array(z.object({
    orderItemId: z.number().int().positive(),
    quantity: z.number().int().positive('Quantity must be positive'),
    reason: z.string().optional(),
    condition: z.enum(['unopened', 'like_new', 'used', 'damaged']).optional()
  })).min(1, 'Must return at least one item'),
  autoApprove: z.boolean().optional()
});

// Return update schema
export const updateReturnSchema = z.object({
  status: z.enum([
    'requested', 'approved', 'rejected', 'shipping', 
    'received', 'processing', 'completed', 'cancelled'
  ]).optional(),
  internalNotes: z.string().max(1000).optional(),
  refundAmountCents: z.number().int().min(0).optional(),
  processRefund: z.boolean().optional()
});

// Return query params schema
export const returnQuerySchema = z.object({
  status: z.string().optional(),
  orderId: z.string().uuid().optional(),
  customerId: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20)
});