/**
 * @jest-environment node
 */

/**
 * Require Elevated Admin Tests
 *
 * Tests lib/auth/require-elevated-admin.ts
 * - Admin role check
 * - TOTP-only elevation
 * - WebAuthn-only elevation
 * - Both methods (TOTP + WebAuthn)
 * - No 2FA configured (access without elevation)
 */

// ─── Mocks ──────────────────────────────────────────────────────

jest.mock('@/lib/auth', () => ({
  getCurrentUser: jest.fn(),
}));

jest.mock('@/lib/auth/totp', () => ({
  isElevationValid: jest.fn(),
}));

jest.mock('@/lib/prisma', () => ({
  prisma: {
    webAuthnCredential: {
      count: jest.fn(),
    },
  },
}));

jest.mock('@/lib/constants', () => ({
  ADMIN_ROLES: ['ADMIN', 'SUPER_ADMIN', 'GOD'],
  HTTP_STATUS: {
    FORBIDDEN: 403,
  },
}));

// ─── Imports ────────────────────────────────────────────────────

import { getCurrentUser } from '@/lib/auth';
import { isElevationValid } from '@/lib/auth/totp';
import { prisma } from '@/lib/prisma';
import { requireElevatedAdmin, requireAdminWithElevationStatus } from '@/lib/auth/require-elevated-admin';

const mockGetCurrentUser = getCurrentUser as jest.Mock;
const mockIsElevationValid = isElevationValid as jest.Mock;
const mockWebAuthnCount = prisma.webAuthnCredential.count as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
});

// ═══════════════════════════════════════════════════════════════
// requireElevatedAdmin
// ═══════════════════════════════════════════════════════════════

describe('requireElevatedAdmin', () => {
  it('should deny non-authenticated users', async () => {
    mockGetCurrentUser.mockResolvedValue(null);
    const result = await requireElevatedAdmin();
    expect(result.authorized).toBe(false);
    expect(result.response).toBeDefined();
  });

  it('should deny non-admin users', async () => {
    mockGetCurrentUser.mockResolvedValue({ id: 'user-1', role: 'USER' });
    const result = await requireElevatedAdmin();
    expect(result.authorized).toBe(false);
  });

  it('should allow admin with no 2FA as not elevated', async () => {
    mockGetCurrentUser.mockResolvedValue({
      id: 'admin-1',
      role: 'ADMIN',
      totpEnabled: false,
    });
    mockWebAuthnCount.mockResolvedValue(0);

    const result = await requireElevatedAdmin();
    expect(result.authorized).toBe(true);
    expect(result.elevated).toBe(false);
  });

  it('should require elevation when TOTP is enabled but not elevated', async () => {
    mockGetCurrentUser.mockResolvedValue({
      id: 'admin-1',
      role: 'ADMIN',
      totpEnabled: true,
      adminElevatedUntil: null,
    });
    mockWebAuthnCount.mockResolvedValue(0);
    mockIsElevationValid.mockReturnValue(false);

    const result = await requireElevatedAdmin();
    expect(result.authorized).toBe(true);
    expect(result.elevated).toBe(false);
    expect(result.response).toBeDefined();
  });

  it('should require elevation when WebAuthn is registered but not elevated', async () => {
    mockGetCurrentUser.mockResolvedValue({
      id: 'admin-1',
      role: 'ADMIN',
      totpEnabled: false,
      adminElevatedUntil: null,
    });
    mockWebAuthnCount.mockResolvedValue(2); // 2 keys registered
    mockIsElevationValid.mockReturnValue(false);

    const result = await requireElevatedAdmin();
    expect(result.authorized).toBe(true);
    expect(result.elevated).toBe(false);
    expect(result.response).toBeDefined();
  });

  it('should grant elevation when TOTP enabled and session is elevated', async () => {
    const futureDate = new Date(Date.now() + 60000);
    mockGetCurrentUser.mockResolvedValue({
      id: 'admin-1',
      role: 'ADMIN',
      totpEnabled: true,
      adminElevatedUntil: futureDate,
    });
    mockWebAuthnCount.mockResolvedValue(0);
    mockIsElevationValid.mockReturnValue(true);

    const result = await requireElevatedAdmin();
    expect(result.authorized).toBe(true);
    expect(result.elevated).toBe(true);
    expect(result.response).toBeUndefined();
  });

  it('should grant elevation when WebAuthn registered and session is elevated', async () => {
    const futureDate = new Date(Date.now() + 60000);
    mockGetCurrentUser.mockResolvedValue({
      id: 'admin-1',
      role: 'ADMIN',
      totpEnabled: false,
      adminElevatedUntil: futureDate,
    });
    mockWebAuthnCount.mockResolvedValue(1);
    mockIsElevationValid.mockReturnValue(true);

    const result = await requireElevatedAdmin();
    expect(result.authorized).toBe(true);
    expect(result.elevated).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════
// requireAdminWithElevationStatus
// ═══════════════════════════════════════════════════════════════

describe('requireAdminWithElevationStatus', () => {
  it('should report elevation status correctly with WebAuthn', async () => {
    mockGetCurrentUser.mockResolvedValue({
      id: 'admin-1',
      role: 'ADMIN',
      totpEnabled: false,
      adminElevatedUntil: new Date(Date.now() + 60000),
    });
    mockWebAuthnCount.mockResolvedValue(1);
    mockIsElevationValid.mockReturnValue(true);

    const result = await requireAdminWithElevationStatus();
    expect(result.authorized).toBe(true);
    expect(result.elevated).toBe(true);
  });

  it('should report not elevated when no 2FA', async () => {
    mockGetCurrentUser.mockResolvedValue({
      id: 'admin-1',
      role: 'ADMIN',
      totpEnabled: false,
      adminElevatedUntil: null,
    });
    mockWebAuthnCount.mockResolvedValue(0);

    const result = await requireAdminWithElevationStatus();
    expect(result.authorized).toBe(true);
    expect(result.elevated).toBe(false);
  });
});
