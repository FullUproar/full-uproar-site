/**
 * Full Uproar Spacing System
 *
 * Centralized spacing scale for consistent layouts.
 * Based on 4px/0.25rem increments for precise control.
 *
 * ⚠️ AI MAINTAINER NOTES:
 * -----------------------
 * ALWAYS import spacing from this file instead of hardcoding values.
 * Use semantic names when possible (section, card, etc.).
 *
 * Usage:
 * ```typescript
 * import { spacing } from '@/lib/design-system';
 * style={{ padding: spacing.md, gap: spacing.sm }}
 * ```
 */

// Base spacing scale (use for gaps, margins, padding)
export const spacing = {
  // Core scale
  none: '0',
  xs: '0.25rem',    // 4px
  sm: '0.5rem',     // 8px
  md: '1rem',       // 16px
  lg: '1.5rem',     // 24px
  xl: '2rem',       // 32px
  '2xl': '2.5rem',  // 40px
  '3xl': '3rem',    // 48px
  '4xl': '4rem',    // 64px

  // Semantic spacing
  icon: '0.5rem',        // Gap between icon and text
  button: '0.75rem',     // Internal button padding
  input: '0.75rem',      // Input field padding
  card: '1.5rem',        // Card internal padding
  section: '3rem',       // Section padding vertical
  sectionMobile: '2rem', // Section padding on mobile
  page: '1rem',          // Page horizontal padding
  pageDesktop: '2rem',   // Page horizontal padding on desktop
} as const;

// Component-specific spacing patterns
export const componentSpacing = {
  // Form elements
  formGroup: { marginBottom: spacing.lg },
  formRow: { gap: spacing.lg },
  inputGroup: { gap: spacing.sm },

  // Cards
  cardPadding: spacing.card,
  cardGap: spacing.lg,

  // Sections
  sectionPadding: `${spacing.section} ${spacing.page}`,
  sectionPaddingMobile: `${spacing.sectionMobile} ${spacing.page}`,

  // Grid layouts
  gridGap: spacing.lg,
  gridGapMobile: spacing.md,
} as const;

export type SpacingKey = keyof typeof spacing;

export default spacing;
