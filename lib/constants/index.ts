/**
 * Centralized constants for the Full Uproar application
 * Use these instead of magic strings throughout the codebase
 */

// User roles - order matters for permission hierarchy
export const USER_ROLES = ['USER', 'MODERATOR', 'ADMIN', 'SUPER_ADMIN', 'GOD'] as const;
export type UserRole = (typeof USER_ROLES)[number];

// Admin roles that have elevated access
export const ADMIN_ROLES: readonly UserRole[] = ['ADMIN', 'SUPER_ADMIN', 'GOD'];

// Super admin roles for highest-level operations
export const SUPER_ADMIN_ROLES: readonly UserRole[] = ['SUPER_ADMIN', 'GOD'];

// Membership tiers
export const MEMBERSHIP_TIERS = ['FREE', 'FUGLY_PRIME', 'VIP', 'CREATOR', 'BETA_TESTER'] as const;
export type MembershipTier = (typeof MEMBERSHIP_TIERS)[number];

// Order statuses
export const ORDER_STATUSES = [
  'PENDING',
  'CONFIRMED',
  'PROCESSING',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
  'REFUNDED',
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

// Payment statuses
export const PAYMENT_STATUSES = [
  'PENDING',
  'COMPLETED',
  'FAILED',
  'REFUNDED',
  'PARTIALLY_REFUNDED',
] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

// Support ticket statuses
export const TICKET_STATUSES = ['OPEN', 'IN_PROGRESS', 'WAITING', 'RESOLVED', 'CLOSED'] as const;
export type TicketStatus = (typeof TICKET_STATUSES)[number];

// Game night statuses
export const GAME_NIGHT_STATUSES = ['PLANNING', 'LOCKED_IN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'] as const;
export type GameNightStatus = (typeof GAME_NIGHT_STATUSES)[number];

// Game night vibes
export const GAME_NIGHT_VIBES = ['CHILL', 'COMPETITIVE', 'CHAOS', 'PARTY', 'COZY'] as const;
export type GameNightVibe = (typeof GAME_NIGHT_VIBES)[number];

// Guest RSVP statuses
export const GUEST_STATUSES = ['PENDING', 'IN', 'MAYBE', 'OUT'] as const;
export type GuestStatus = (typeof GUEST_STATUSES)[number];

// Product categories
export const GAME_CATEGORIES = ['PARTY', 'STRATEGY', 'CARD', 'DICE', 'WORD', 'TRIVIA', 'ADULT'] as const;
export type GameCategory = (typeof GAME_CATEGORIES)[number];

// Shipping carriers
export const SHIPPING_CARRIERS = ['fedex', 'ups', 'usps', 'dhl'] as const;
export type ShippingCarrier = (typeof SHIPPING_CARRIERS)[number];

// Trust levels for forum users
export const TRUST_LEVELS = [0, 1, 2, 3, 4] as const;
export type TrustLevel = (typeof TRUST_LEVELS)[number];

// HTTP status codes with semantic names
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
} as const;

// API error codes
export const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  CONFLICT: 'CONFLICT',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
  RATE_LIMITED: 'RATE_LIMITED',
} as const;

// Pagination defaults
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
} as const;

// Rate limiting defaults
export const RATE_LIMITS = {
  API_REQUESTS_PER_MINUTE: 100,
  AUTH_ATTEMPTS_PER_HOUR: 10,
  CONTACT_FORM_PER_HOUR: 5,
} as const;

// Helper to check if a role is admin-level
export function isAdminRole(role: string): boolean {
  return ADMIN_ROLES.includes(role as UserRole);
}

// Helper to check if a role is super-admin-level
export function isSuperAdminRole(role: string): boolean {
  return SUPER_ADMIN_ROLES.includes(role as UserRole);
}

// Re-export test IDs
export * from './test-ids';
