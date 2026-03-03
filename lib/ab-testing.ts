/**
 * Simple cookie-based A/B testing utilities.
 * Used for homepage experiment: variant A (current) vs variant B (Troublemaker).
 */

export const AB_COOKIE_NAME = 'fu_ab_home';
export const AB_COOKIE_DAYS = 30;

export type ABVariant = 'A' | 'B';

/** Read an A/B variant cookie. Returns null if not set or cookies unavailable. */
export function getABVariant(name: string): ABVariant | null {
  try {
    const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([AB])`));
    return match ? (match[1] as ABVariant) : null;
  } catch {
    return null;
  }
}

/** Set an A/B variant cookie with expiry in days. */
export function setABVariant(name: string, variant: ABVariant, days: number): void {
  try {
    const expires = new Date(Date.now() + days * 86400000).toUTCString();
    document.cookie = `${name}=${variant}; expires=${expires}; path=/; SameSite=Lax`;
  } catch {
    // Cookies blocked — silently fail
  }
}

/** Randomly assign a variant (50/50 split). */
export function assignVariant(): ABVariant {
  return Math.random() < 0.5 ? 'A' : 'B';
}
