// Application-wide constants

export const APP_NAME = 'Full Uproar';
export const APP_DESCRIPTION = 'Chaos, Games, and Fugly Fun';

// API versioning
export const API_VERSION = 'v1';
export const API_BASE_PATH = `/api/${API_VERSION}`;

// Pagination defaults
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

// Image sizes
export const IMAGE_SIZES = {
  thumbnail: { width: 100, height: 100 },
  small: { width: 300, height: 300 },
  medium: { width: 600, height: 600 },
  large: { width: 1200, height: 1200 }
} as const;

// File upload limits
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

// Order statuses
export const ORDER_STATUSES = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled'
} as const;

// Merch categories
export const MERCH_CATEGORIES = {
  APPAREL: 'apparel',
  ACCESSORIES: 'accessories',
  COLLECTIBLES: 'collectibles',
  STICKERS: 'stickers',
  OTHER: 'other'
} as const;

// Artwork categories
export const ARTWORK_CATEGORIES = {
  BACKGROUND: 'background',
  CHARACTER: 'character',
  LOGO: 'logo',
  DECORATION: 'decoration',
  OTHER: 'other'
} as const;

// Cache durations (in seconds)
export const CACHE_DURATIONS = {
  NONE: 0,
  SHORT: 60, // 1 minute
  MEDIUM: 300, // 5 minutes
  LONG: 3600, // 1 hour
  DAY: 86400 // 24 hours
} as const;

// Error messages
export const ERROR_MESSAGES = {
  GENERIC: 'An error occurred. Please try again.',
  NOT_FOUND: 'The requested resource was not found.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  VALIDATION: 'Please check your input and try again.',
  NETWORK: 'Network error. Please check your connection.',
  SERVER: 'Server error. Please try again later.'
} as const;

// Success messages
export const SUCCESS_MESSAGES = {
  CREATED: 'Successfully created!',
  UPDATED: 'Successfully updated!',
  DELETED: 'Successfully deleted!',
  SAVED: 'Changes saved successfully!'
} as const;

// Regular expressions
export const REGEX_PATTERNS = {
  SLUG: /^[a-z0-9-]+$/,
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^\+?[\d\s-()]+$/,
  ZIP_CODE: /^\d{5}(-\d{4})?$/
} as const;

// SEO defaults
export const SEO_DEFAULTS = {
  title: APP_NAME,
  description: APP_DESCRIPTION,
  openGraph: {
    type: 'website',
    locale: 'en_US',
    site_name: APP_NAME
  },
  twitter: {
    cardType: 'summary_large_image'
  }
} as const;