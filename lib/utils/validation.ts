import { z } from 'zod';
import { ValidationError } from './errors';

// Common validation schemas
export const idSchema = z.number().int().positive();
export const slugSchema = z.string().regex(/^[a-z0-9-]+$/, 'Invalid slug format');
export const emailSchema = z.string().email();
export const urlSchema = z.string().url();
export const priceSchema = z.number().int().min(0);

// Pagination schemas
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20)
});

// Common field schemas
export const imageSchema = z.object({
  url: urlSchema,
  alt: z.string().optional()
});

// Product-related schemas
export const createGameSchema = z.object({
  title: z.string().min(1).max(200),
  tagline: z.string().max(200).optional(),
  description: z.string().min(1),
  priceCents: priceSchema,
  players: z.string().min(1),
  timeToPlay: z.string().min(1),
  ageRating: z.string().min(1),
  imageUrl: urlSchema.optional(),
  isBundle: z.boolean().optional().default(false),
  isPreorder: z.boolean().optional().default(true),
  featured: z.boolean().optional().default(false),
  bundleInfo: z.string().optional(),
  stock: z.number().int().min(0).optional().default(0),
  tags: z.array(z.string()).optional(),
  additionalImages: z.array(imageSchema).optional()
});

export const updateGameSchema = createGameSchema.partial();

export const merchCategorySchema = z.enum(['apparel', 'accessories', 'collectibles', 'stickers', 'other']);

export const createMerchSchema = z.object({
  name: z.string().min(1).max(200),
  slug: slugSchema.optional(),
  description: z.string().min(1),
  category: merchCategorySchema,
  priceCents: priceSchema,
  imageUrl: urlSchema.optional(),
  sizes: z.array(z.string()).optional(),
  featured: z.boolean().optional().default(false),
  tags: z.array(z.string()).optional()
});

export const updateMerchSchema = createMerchSchema.partial();

// Order schemas
export const orderStatusSchema = z.enum(['pending', 'processing', 'shipped', 'delivered', 'cancelled']);

export const createOrderItemSchema = z.object({
  itemType: z.enum(['game', 'merch']),
  itemId: z.number().int().positive(),
  quantity: z.number().int().positive(),
  merchSize: z.string().optional()
});

export const createOrderSchema = z.object({
  customerEmail: emailSchema,
  customerName: z.string().min(1).max(200),
  shippingAddress: z.string().min(1),
  billingAddress: z.string().optional(),
  items: z.array(createOrderItemSchema).min(1)
});

export const updateOrderStatusSchema = z.object({
  status: orderStatusSchema,
  trackingNumber: z.string().optional(),
  statusNote: z.string().optional()
});

// Printify schemas
export const printifySettingsSchema = z.object({
  printify_api_key: z.string().optional(),
  printify_shop_id: z.string().optional(),
  printify_enabled: z.enum(['true', 'false']).optional()
});

// Validation helper functions
export async function validateRequest<T>(
  data: unknown,
  schema: z.ZodSchema<T>
): Promise<T> {
  try {
    return await schema.parseAsync(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError('Validation failed', {
        errors: error.issues.map(e => ({
          field: e.path.join('.'),
          message: e.message
        }))
      });
    }
    throw error;
  }
}

// Query parameter validation
export function validateQueryParams<T>(
  params: URLSearchParams,
  schema: z.ZodSchema<T>
): T {
  const data = Object.fromEntries(params.entries());
  
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError('Invalid query parameters', {
        errors: error.issues.map(e => ({
          field: e.path.join('.'),
          message: e.message
        }))
      });
    }
    throw error;
  }
}

// Type-safe slug generator
export function generateSlug(text: string, suffix?: string): string {
  const base = text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
  
  return suffix ? `${base}-${suffix}` : base;
}

// Sanitize input for security
export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .trim();
}

// Validate and sanitize HTML content (for rich text fields)
export function sanitizeHtml(html: string): string {
  // In a real app, use a library like DOMPurify
  // For now, basic sanitization
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '');
}