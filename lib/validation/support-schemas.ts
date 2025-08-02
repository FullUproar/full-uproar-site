import { z } from 'zod';

// Support ticket creation schema
export const createTicketSchema = z.object({
  customerName: z.string().min(1, 'Customer name is required').max(100),
  customerEmail: z.string().email('Invalid email address'),
  orderId: z.string().uuid().optional(),
  category: z.enum([
    'order_issue', 'payment_issue', 'shipping', 
    'product_question', 'return_refund', 'technical', 'other'
  ]),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
  subject: z.string().min(1, 'Subject is required').max(200),
  message: z.string().min(1, 'Message is required').max(5000),
  assignToSelf: z.boolean().optional()
});

// Ticket update schema
export const updateTicketSchema = z.object({
  status: z.enum([
    'open', 'in_progress', 'waiting_customer', 'resolved', 'closed'
  ]).optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
  category: z.enum([
    'order_issue', 'payment_issue', 'shipping', 
    'product_question', 'return_refund', 'technical', 'other'
  ]).optional(),
  assignedToId: z.string().nullable().optional(),
  internalNotes: z.string().max(1000).optional(),
  resolution: z.string().max(5000).optional()
});

// Message creation schema
export const createMessageSchema = z.object({
  message: z.string().min(1, 'Message cannot be empty').max(5000),
  isInternal: z.boolean().default(false)
});

// Ticket query params schema
export const ticketQuerySchema = z.object({
  status: z.string().optional(),
  priority: z.string().optional(),
  category: z.string().optional(),
  search: z.string().max(100).optional(),
  assignedToId: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20)
});