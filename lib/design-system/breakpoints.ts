/**
 * Full Uproar Breakpoint System
 *
 * Centralized responsive breakpoints for consistent mobile/desktop behavior.
 *
 * ⚠️ AI MAINTAINER NOTES:
 * -----------------------
 * ALWAYS use these breakpoints instead of hardcoding pixel values.
 * Use the isMobile/isTablet/isDesktop helpers in components.
 *
 * Usage:
 * ```typescript
 * import { breakpoints, useBreakpoint } from '@/lib/design-system';
 *
 * // In component:
 * const { isMobile, isTablet, isDesktop } = useBreakpoint();
 *
 * // Or check directly:
 * if (window.innerWidth <= breakpoints.mobile) { ... }
 * ```
 */

export const breakpoints = {
  mobile: 640,    // Below this = mobile
  tablet: 768,    // Below this = mobile/tablet
  desktop: 1024,  // Below this = tablet
  wide: 1280,     // Below this = desktop
  ultrawide: 1536, // Above this = ultrawide
} as const;

// Media query strings for CSS-in-JS
export const mediaQueries = {
  mobile: `@media (max-width: ${breakpoints.mobile}px)`,
  tablet: `@media (max-width: ${breakpoints.tablet}px)`,
  desktop: `@media (max-width: ${breakpoints.desktop}px)`,
  wide: `@media (min-width: ${breakpoints.wide}px)`,
} as const;

/**
 * Hook to get current breakpoint info
 * Use in client components only
 */
export function useBreakpoint() {
  if (typeof window === 'undefined') {
    // SSR fallback
    return {
      isMobile: false,
      isTablet: false,
      isDesktop: true,
      isWide: false,
      width: 1024,
    };
  }

  const width = window.innerWidth;
  return {
    isMobile: width <= breakpoints.mobile,
    isTablet: width <= breakpoints.tablet && width > breakpoints.mobile,
    isDesktop: width > breakpoints.tablet,
    isWide: width >= breakpoints.wide,
    width,
  };
}

/**
 * Helper to check if mobile
 */
export function checkIsMobile(): boolean {
  if (typeof window === 'undefined') return false;
  return window.innerWidth <= breakpoints.tablet;
}

export type BreakpointKey = keyof typeof breakpoints;

export default breakpoints;
