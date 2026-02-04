/**
 * Full Uproar Design System
 *
 * Centralized exports for all design tokens.
 * Import from this file for easy access to all design system values.
 *
 * Usage:
 * ```typescript
 * import { colors, typography, spacing, breakpoints, buttonStyles } from '@/lib/design-system';
 * ```
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
