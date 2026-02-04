/**
 * Full Uproar Brand Colors
 *
 * Central color definitions for consistent branding across the site.
 * Official Pantone colors with sRGB hex equivalents.
 *
 * ⚠️ AI MAINTAINER NOTES:
 * -----------------------
 * ALWAYS import colors from this file instead of hardcoding hex values.
 * If you see any of the "WRONG" colors below in the codebase, replace them.
 *
 * WRONG → CORRECT:
 * - #FF8200 → #FF8200 (Tailwind orange-500 vs our Pantone 151 C)
 * - #fb923c → #FF8200 (Tailwind orange-400)
 * - #ea580c → #FF8200 for primary use (only use for hover/dark states)
 * - #FBDB65 → #FBDB65 for headline text (Tailwind yellow-200 vs Pantone 120 C)
 * - #FBDB65 → #FBDB65 for headline text (orange-300 vs cream yellow)
 * - #7D55C7 → #7D55C7 for purple accents (Tailwind vs Pantone 266 C)
 *
 * Usage pattern:
 * ```typescript
 * import { colors } from '@/lib/colors';
 * // or
 * import colors from '@/lib/colors';
 *
 * style={{ color: colors.primary, background: colors.bgDark }}
 * ```
 */

export const colors = {
  // ============================================
  // OFFICIAL PANTONE BRAND COLORS (2025)
  // ============================================

  // Pantone 151 C — Primary Brand Orange
  // Hex: #FF8200 | Role: Primary brand color, main CTA, core identity
  chaosOrange: '#FF8200',

  // Pantone Orange 021 C — Vibrant Accent Orange
  // Hex: #FE5000 | Role: Vibrant CTAs, urgent highlights, punch accents
  vibrantOrange: '#FE5000',

  // Pantone 120 C — Cream Yellow (Headlines)
  // Hex: #FBDB65 | Role: Headline text, warm highlights on dark
  creamYellow: '#FBDB65',

  // Pantone 266 C — Purple Accent
  // Hex: #7D55C7 | Role: Cult features, special/premium accents
  chaosPurple: '#7D55C7',

  // ============================================
  // LEGACY/UTILITY COLORS (aliased for compatibility)
  // ============================================
  primary: '#FF8200',           // Alias for chaosOrange (PMS 151 C)
  primaryLight: '#FBDB65',      // Light orange/peach for accents
  primaryDark: '#ea580c',       // Darker orange for hover states

  // Background Colors
  bgDark: '#0a0a0a',            // Near black - main background
  bgCard: '#1f2937',            // Card/component backgrounds
  bgCardHover: '#374151',       // Hover state for cards
  bgNav: 'rgba(17, 24, 39, 0.9)', // Navigation background with transparency

  // Text Colors
  textPrimary: '#FBDB65',       // PMS 120 C - Cream yellow headlines
  textSecondary: '#e2e8f0',     // Light gray - secondary text
  textMuted: '#9ca3af',         // Muted text
  textDark: '#111827',          // Dark text (on light backgrounds)

  // Accent Colors
  purple: '#7D55C7',            // PMS 266 C - Purple accent
  purpleLight: '#a78bfa',       // Light purple (digital variant)
  purpleBg: '#4c1d95',          // Purple background

  // Status Colors
  error: '#ef4444',             // Red for errors/warnings
  success: '#10b981',           // Green for success
  warning: '#fbbf24',           // Yellow/gold for warnings

  // Gradients (as strings for direct use)
  gradientPrimary: 'linear-gradient(135deg, #FF8200 0%, #ea580c 100%)',
  gradientHero: 'linear-gradient(to bottom right, #111827, #1f2937, #ea580c)',
  gradientExplosion: 'linear-gradient(to right, #ef4444, #FF8200)',
} as const;

// Type for color keys
export type ColorKey = keyof typeof colors;

// Helper to get rgba version of hex colors
export function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// Pre-computed rgba values for common use cases (PMS 151 C based)
export const colorsRgba = {
  primaryGlow: 'rgba(255, 130, 0, 0.4)',
  primaryGlowStrong: 'rgba(255, 130, 0, 0.6)',
  primaryGlowLight: 'rgba(255, 130, 0, 0.2)',
  primaryShadow: 'rgba(255, 130, 0, 0.5)',
} as const;

export default colors;
