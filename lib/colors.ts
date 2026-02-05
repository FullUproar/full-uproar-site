/**
 * Full Uproar Brand Colors
 * ========================
 * SINGLE SOURCE OF TRUTH for all brand colors.
 * Official Pantone colors matched to sRGB hex equivalents.
 *
 * ⚠️ AI MAINTAINER INSTRUCTIONS:
 * ------------------------------
 * 1. ALWAYS import from this file - NEVER hardcode hex values
 * 2. If you see these WRONG values anywhere, they are LEGACY/TAILWIND defaults:
 *
 *    WRONG (Tailwind)     CORRECT (Pantone)     USE
 *    ----------------     -----------------     ---
 *    #f97316              #FF8200               colors.primary
 *    #fb923c              #FF8200               colors.primary
 *    #fdba74              #FBDB65               colors.creamYellow
 *    #fde68a              #FBDB65               colors.creamYellow
 *    #8b5cf6              #7D55C7               colors.purple
 *
 * 3. For rgba colors, use colorsRgba.* or hexToRgba()
 *    - WRONG: rgba(249, 115, 22, 0.5)  [Tailwind orange]
 *    - RIGHT: rgba(255, 130, 0, 0.5)   [Our orange] or colorsRgba.primaryGlow
 *
 * Usage:
 * ```typescript
 * import { colors, colorsRgba, hexToRgba } from '@/lib/colors';
 * // or from design system:
 * import { colors } from '@/lib/design-system';
 *
 * style={{ color: colors.primary, background: colors.bgDark }}
 * style={{ boxShadow: `0 0 20px ${colorsRgba.primaryGlow}` }}
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
