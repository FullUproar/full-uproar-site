import { z } from 'zod';

// Order creation schema
export const createOrderSchema = z.object({
  customerEmail: z.string().email('Invalid email address'),
  customerName: z.string().min(1, 'Customer name is required').max(100),
  shippingAddress: z.string().min(10, 'Shipping address is required').max(500),
  billingAddress: z.string().min(10, 'Billing address is required').max(500),
  totalCents: z.number().int().positive('Total must be positive'),
  shippingCents: z.number().int().min(0, 'Shipping cannot be negative'),
  taxCents: z.number().int().min(0, 'Tax cannot be negative'),
  items: z.array(z.object({
    itemType: z.enum(['game', 'merch']),
    gameId: z.number().int().positive().optional(),
    merchId: z.number().int().positive().optional(),
    merchSize: z.string().optional(),
    quantity: z.number().int().positive('Quantity must be positive'),
    priceCents: z.number().int().positive('Price must be positive')
  })).min(1, 'Order must have at least one item')
}).refine(data => {
  // Ensure each item has either gameId or merchId
  return data.items.every(item => 
    (item.itemType === 'game' && item.gameId) || 
    (item.itemType === 'merch' && item.merchId)
  );
}, {
  message: 'Each item must have a valid gameId or merchId'
});

// Order update schema
export const updateOrderSchema = z.object({
  status: z.enum([
    'pending', 'paid', 'processing', 'picking', 'packing', 
    'ready', 'shipped', 'delivered', 'cancelled', 'refunded'
  ]).optional(),
  trackingNumber: z.string().max(100).optional(),
  shippingCarrier: z.string().max(50).optional(),
  notes: z.string().max(1000).optional(),
  internalNotes: z.string().max(1000).optional()
});

// Order refund schema
export const refundOrderSchema = z.object({
  amountCents: z.number().int().positive('Refund amount must be positive'),
  reason: z.string().min(1, 'Reason is required').max(500)
});

// Order query params schema
export const orderQuerySchema = z.object({
  status: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  search: z.string().max(100).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  fulfillment: z.string().optional(),
  priority: z.string().optional()
});

// Shipping label schema
export const createShippingLabelSchema = z.object({
  carrier: z.enum(['usps', 'ups', 'fedex', 'dhl']),
  service: z.string().min(1).max(50),
  weight: z.number().positive('Weight must be positive'),
  length: z.number().positive('Length must be positive'),
  width: z.number().positive('Width must be positive'),
  height: z.number().positive('Height must be positive'),
  insuranceValue: z.number().min(0).optional()
});