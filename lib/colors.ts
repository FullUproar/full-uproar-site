/**
 * Full Uproar Brand Colors
 *
 * Central color definitions for consistent branding across the site.
 * Official Pantone colors with sRGB equivalents provided by Pantone.
 */

export const colors = {
  // ============================================
  // OFFICIAL PANTONE BRAND COLORS
  // ============================================

  // Pantone 2018 C — Primary Chaos Orange
  // RGB: 255, 117, 0 | LAB: 68.40, 54.35, 88.71 | CMYK: 0, 54, 100, 0
  // Role: Primary brand color, CTA color, core identity highlight
  chaosOrange: '#FF7500',

  // Pantone 2006 C — Golden Chaos
  // RGB: 235, 188, 78 | LAB: 79.26, 9.66, 60.43 | CMYK: 0, 20, 75, 0
  // Role: Secondary accent, illustration highlight tone, warm contrast
  goldenChaos: '#EBBC4E',

  // Pantone 7417 C — Warm Chaos Coral
  // RGB: 224, 79, 57 | LAB: 55.48, 59.93, 45.74 | CMYK: 0, 65, 75, 0
  // Role: Tertiary accent, soft UI highlights, comic backgrounds
  chaosCoral: '#E04F39',

  // ============================================
  // LEGACY/UTILITY COLORS (aliased for compatibility)
  // ============================================
  primary: '#FF7500',           // Alias for chaosOrange
  primaryLight: '#fdba74',      // Light orange/peach for accents
  primaryDark: '#ea580c',       // Darker orange for hover states

  // Background Colors
  bgDark: '#0a0a0a',            // Near black - main background
  bgCard: '#1f2937',            // Card/component backgrounds
  bgCardHover: '#374151',       // Hover state for cards
  bgNav: 'rgba(17, 24, 39, 0.9)', // Navigation background with transparency

  // Text Colors
  textPrimary: '#fde68a',       // Pale yellow - primary text
  textSecondary: '#e2e8f0',     // Light gray - secondary text
  textMuted: '#9ca3af',         // Muted text
  textDark: '#111827',          // Dark text (on light backgrounds)

  // Accent Colors
  purple: '#8b5cf6',            // Purple accent for special items
  purpleLight: '#c4b5fd',       // Light purple
  purpleBg: '#4c1d95',          // Purple background

  // Status Colors
  error: '#ef4444',             // Red for errors/warnings
  success: '#10b981',           // Green for success
  warning: '#fbbf24',           // Yellow/gold for warnings

  // Gradients (as strings for direct use)
  gradientPrimary: 'linear-gradient(135deg, #FF7500 0%, #ea580c 100%)',
  gradientHero: 'linear-gradient(to bottom right, #111827, #1f2937, #ea580c)',
  gradientExplosion: 'linear-gradient(to right, #ef4444, #FF7500)',
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

// Pre-computed rgba values for common use cases
export const colorsRgba = {
  primaryGlow: 'rgba(255, 117, 0, 0.4)',
  primaryGlowStrong: 'rgba(255, 117, 0, 0.6)',
  primaryGlowLight: 'rgba(255, 117, 0, 0.2)',
  primaryShadow: 'rgba(255, 117, 0, 0.5)',
} as const;

export default colors;
