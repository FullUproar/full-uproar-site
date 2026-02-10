/**
 * Unit tests for TOTP helpers (lib/auth/totp.ts)
 * Tests elevation validity and expiry calculation.
 */

import { isElevationValid, getElevationExpiry } from '@/lib/auth/totp';

describe('isElevationValid', () => {
  it('should return false for null', () => {
    expect(isElevationValid(null)).toBe(false);
  });

  it('should return false for past date', () => {
    const pastDate = new Date('2020-01-01T00:00:00Z');
    expect(isElevationValid(pastDate)).toBe(false);
  });

  it('should return true for future date', () => {
    const futureDate = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now
    expect(isElevationValid(futureDate)).toBe(true);
  });

  it('should return false for date that just passed', () => {
    const justPassed = new Date(Date.now() - 1000); // 1 second ago
    expect(isElevationValid(justPassed)).toBe(false);
  });
});

describe('getElevationExpiry', () => {
  it('should return a date ~180 minutes in the future', () => {
    const before = Date.now();
    const expiry = getElevationExpiry();
    const after = Date.now();

    // Should be approximately 180 minutes from now
    const expectedMin = before + 179 * 60 * 1000; // 179 min (allow 1 min slack)
    const expectedMax = after + 181 * 60 * 1000; // 181 min

    expect(expiry.getTime()).toBeGreaterThanOrEqual(expectedMin);
    expect(expiry.getTime()).toBeLessThanOrEqual(expectedMax);
  });

  it('should return a Date object', () => {
    const expiry = getElevationExpiry();
    expect(expiry).toBeInstanceOf(Date);
  });
});
