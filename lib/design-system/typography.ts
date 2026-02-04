/**
 * Full Uproar Typography System
 *
 * Centralized typography definitions for consistent text styling.
 * All font sizes use rem for accessibility (respects user font preferences).
 *
 * ⚠️ AI MAINTAINER NOTES:
 * -----------------------
 * ALWAYS import typography from this file instead of hardcoding values.
 * Use the semantic names (hero, h1, h2, body, etc.) not raw sizes.
 *
 * Usage:
 * ```typescript
 * import { typography } from '@/lib/design-system';
 * style={{ ...typography.h1 }}
 * ```
 */

export const typography = {
  // Display / Hero text - for main page headers
  hero: {
    fontSize: '3rem',      // 48px
    fontWeight: 900,
    lineHeight: 1.1,
  },

  // Heading 1 - primary section headers
  h1: {
    fontSize: '2.25rem',   // 36px
    fontWeight: 900,
    lineHeight: 1.2,
  },

  // Heading 2 - secondary headers
  h2: {
    fontSize: '1.875rem',  // 30px
    fontWeight: 700,
    lineHeight: 1.25,
  },

  // Heading 3 - card titles, subsections
  h3: {
    fontSize: '1.5rem',    // 24px
    fontWeight: 700,
    lineHeight: 1.3,
  },

  // Heading 4 - smaller headings
  h4: {
    fontSize: '1.25rem',   // 20px
    fontWeight: 600,
    lineHeight: 1.4,
  },

  // Body text - main content
  body: {
    fontSize: '1rem',      // 16px
    fontWeight: 400,
    lineHeight: 1.6,
  },

  // Body large - emphasized body text
  bodyLarge: {
    fontSize: '1.125rem',  // 18px
    fontWeight: 500,
    lineHeight: 1.6,
  },

  // Body bold - strong body text
  bodyBold: {
    fontSize: '1rem',      // 16px
    fontWeight: 700,
    lineHeight: 1.6,
  },

  // Small text - captions, labels
  small: {
    fontSize: '0.875rem',  // 14px
    fontWeight: 500,
    lineHeight: 1.5,
  },

  // Extra small - fine print, badges
  xs: {
    fontSize: '0.75rem',   // 12px
    fontWeight: 500,
    lineHeight: 1.5,
  },

  // Button text
  button: {
    fontSize: '1rem',      // 16px
    fontWeight: 700,
    lineHeight: 1,
  },

  // Price display
  price: {
    fontSize: '2rem',      // 32px
    fontWeight: 900,
    lineHeight: 1,
  },

  // Price small (in cards)
  priceSmall: {
    fontSize: '1.5rem',    // 24px
    fontWeight: 900,
    lineHeight: 1,
  },

  // Label text (forms)
  label: {
    fontSize: '0.875rem',  // 14px
    fontWeight: 600,
    lineHeight: 1.5,
  },
} as const;

export type TypographyKey = keyof typeof typography;

export default typography;
