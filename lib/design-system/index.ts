/**
 * Full Uproar Design System
 * =========================
 * CENTRAL EXPORT for all design tokens.
 *
 * ⚠️ AI MAINTAINER INSTRUCTIONS:
 * ------------------------------
 * This is the PREFERRED import for design system values.
 * Import everything you need from here in a single line:
 *
 * ```typescript
 * import { colors, typography, spacing, buttonSizes } from '@/lib/design-system';
 * ```
 *
 * Available exports:
 * - colors, colorsRgba, hexToRgba  — Brand colors (lib/colors.ts)
 * - typography                      — Font sizes, weights (./typography.ts)
 * - spacing, componentSpacing       — Margins, padding, gaps (./spacing.ts)
 * - breakpoints, useBreakpoint      — Responsive utilities (./breakpoints.ts)
 * - buttonSizes, buttonVariants     — Button styles (./buttons.ts)
 *
 * DO NOT:
 * - Hardcode hex values (use colors.*)
 * - Hardcode font sizes (use typography.*)
 * - Hardcode spacing values (use spacing.*)
 * - Use Tailwind classes (this site uses inline styles only)
 */

// Re-export colors from existing file
export { colors, colorsRgba, hexToRgba } from '../colors';
export type { ColorKey } from '../colors';

// Typography
export { typography } from './typography';
export type { TypographyKey } from './typography';

// Spacing
export { spacing, componentSpacing } from './spacing';
export type { SpacingKey } from './spacing';

// Breakpoints
export {
  breakpoints,
  mediaQueries,
  useBreakpoint,
  checkIsMobile
} from './breakpoints';
export type { BreakpointKey } from './breakpoints';

// Buttons
export {
  buttonSizes,
  buttonVariants,
  buttonStyles,
  buttonHoverEffects
} from './buttons';
export type { ButtonSize, ButtonVariant } from './buttons';

// Convenience object with all design tokens
export const designSystem = {
  colors: require('../colors').colors,
  typography: require('./typography').typography,
  spacing: require('./spacing').spacing,
  breakpoints: require('./breakpoints').breakpoints,
  buttons: require('./buttons').buttonStyles,
} as const;

export default designSystem;
