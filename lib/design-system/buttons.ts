/**
 * Full Uproar Button System
 *
 * Centralized button styles and sizes for consistency.
 *
 * ⚠️ AI MAINTAINER NOTES:
 * -----------------------
 * ALWAYS import button styles from this file.
 * Use the size variants (small, medium, large) consistently.
 *
 * Usage:
 * ```typescript
 * import { buttonSizes, buttonVariants } from '@/lib/design-system';
 * style={{ ...buttonSizes.medium, ...buttonVariants.primary }}
 * ```
 */

import { colors } from '../colors';

// Button sizes - use consistently across all buttons
export const buttonSizes = {
  small: {
    padding: '0.5rem 1rem',
    fontSize: '0.875rem',
    borderRadius: '6px',
  },
  medium: {
    padding: '0.75rem 1.5rem',
    fontSize: '1rem',
    borderRadius: '8px',
  },
  large: {
    padding: '1rem 2rem',
    fontSize: '1.125rem',
    borderRadius: '10px',
  },
  // Icon-only buttons
  icon: {
    padding: '0.5rem',
    fontSize: '1rem',
    borderRadius: '8px',
  },
  iconSmall: {
    padding: '0.375rem',
    fontSize: '0.875rem',
    borderRadius: '6px',
  },
} as const;

// Button variants - visual styles
export const buttonVariants = {
  primary: {
    background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`,
    color: 'white',
    border: 'none',
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'transform 0.2s, box-shadow 0.2s',
  },
  secondary: {
    background: 'rgba(30, 41, 59, 0.8)',
    color: colors.creamYellow,
    border: `2px solid rgba(255, 130, 0, 0.3)`,
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  outline: {
    background: 'transparent',
    color: colors.creamYellow,
    border: `2px solid rgba(255, 130, 0, 0.5)`,
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  danger: {
    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
    color: 'white',
    border: 'none',
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'transform 0.2s',
  },
  ghost: {
    background: 'transparent',
    color: colors.creamYellow,
    border: 'none',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'opacity 0.2s',
  },
  link: {
    background: 'transparent',
    color: colors.primary,
    border: 'none',
    fontWeight: 600,
    cursor: 'pointer',
    textDecoration: 'underline',
  },
} as const;

// Pre-composed button styles (size + variant)
export const buttonStyles = {
  primaryMedium: { ...buttonSizes.medium, ...buttonVariants.primary },
  primaryLarge: { ...buttonSizes.large, ...buttonVariants.primary },
  primarySmall: { ...buttonSizes.small, ...buttonVariants.primary },
  secondaryMedium: { ...buttonSizes.medium, ...buttonVariants.secondary },
  outlineMedium: { ...buttonSizes.medium, ...buttonVariants.outline },
  dangerMedium: { ...buttonSizes.medium, ...buttonVariants.danger },
  iconPrimary: { ...buttonSizes.icon, ...buttonVariants.primary },
  iconGhost: { ...buttonSizes.icon, ...buttonVariants.ghost },
} as const;

// Hover effects (apply via onMouseEnter/onMouseLeave)
export const buttonHoverEffects = {
  scale: {
    onMouseEnter: (e: React.MouseEvent<HTMLElement>) => {
      e.currentTarget.style.transform = 'scale(1.05)';
    },
    onMouseLeave: (e: React.MouseEvent<HTMLElement>) => {
      e.currentTarget.style.transform = 'scale(1)';
    },
  },
  glow: {
    onMouseEnter: (e: React.MouseEvent<HTMLElement>) => {
      e.currentTarget.style.boxShadow = '0 4px 20px rgba(255, 130, 0, 0.4)';
    },
    onMouseLeave: (e: React.MouseEvent<HTMLElement>) => {
      e.currentTarget.style.boxShadow = 'none';
    },
  },
} as const;

export type ButtonSize = keyof typeof buttonSizes;
export type ButtonVariant = keyof typeof buttonVariants;

export default buttonStyles;
