/**
 * Unit tests for requireElevatedAdmin (lib/auth/require-elevated-admin.ts)
 * Tests the 2FA elevation gate for sensitive admin operations.
 */

// Mock Clerk
jest.mock('@clerk/nextjs/server', () => ({
  auth: jest.fn(),
  currentUser: jest.fn(),
}));

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
  },
}));

// Mock TOTP module
jest.mock('@/lib/auth/totp', () => ({
  isElevationValid: jest.fn(),
}));

import { currentUser } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { isElevationValid } from '@/lib/auth/totp';
import { requireElevatedAdmin, requireAdminWithElevationStatus } from '@/lib/auth/require-elevated-admin';

const mockCurrentUser = currentUser as jest.MockedFunction<typeof currentUser>;
const mockFindUnique = prisma.user.findUnique as jest.MockedFunction<any>;
const mockIsElevationValid = isElevationValid as jest.MockedFunction<typeof isElevationValid>;

const clerkUser = { id: 'clerk_123' } as any;

function makeAdminUser(overrides = {}) {
  return {
    id: 'db-1',
    clerkId: 'clerk_123',
    email: 'admin@test.com',
    role: 'ADMIN',
    permissions: [],
    profile: null,
    totpEnabled: false,
    adminElevatedUntil: null,
    ...overrides,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('requireElevatedAdmin', () => {
  it('should return unauthorized for non-authenticated users', async () => {
    mockCurrentUser.mockResolvedValue(null as any);
    mockFindUnique.mockResolvedValue(null);

    const result = await requireElevatedAdmin();

    expect(result.authorized).toBe(false);
    expect(result.elevated).toBe(false);
    expect(result.response).toBeDefined();
  });

  it('should return unauthorized for regular USER role', async () => {
    mockCurrentUser.mockResolvedValue(clerkUser);
    mockFindUnique.mockResolvedValue(makeAdminUser({ role: 'USER' }));

    const result = await requireElevatedAdmin();

    expect(result.authorized).toBe(false);
    expect(result.elevated).toBe(false);
  });

  it('should authorize admin without 2FA (not elevated)', async () => {
    mockCurrentUser.mockResolvedValue(clerkUser);
    mockFindUnique.mockResolvedValue(makeAdminUser({ totpEnabled: false }));

    const result = await requireElevatedAdmin();

    expect(result.authorized).toBe(true);
    expect(result.elevated).toBe(false);
    expect(result.user).toBeDefined();
  });

  it('should require elevation when 2FA enabled but not elevated', async () => {
    mockCurrentUser.mockResolvedValue(clerkUser);
    mockFindUnique.mockResolvedValue(makeAdminUser({ totpEnabled: true }));
    mockIsElevationValid.mockReturnValue(false);

    const result = await requireElevatedAdmin();

    expect(result.authorized).toBe(true);
    expect(result.elevated).toBe(false);
    expect(result.response).toBeDefined();
    if (result.response) {
      const body = await result.response.json();
      expect(body.requiresElevation).toBe(true);
    }
  });

  it('should fully authorize when 2FA enabled and elevated', async () => {
    const futureDate = new Date(Date.now() + 60 * 60 * 1000);
    mockCurrentUser.mockResolvedValue(clerkUser);
    mockFindUnique.mockResolvedValue(
      makeAdminUser({
        totpEnabled: true,
        adminElevatedUntil: futureDate,
      })
    );
    mockIsElevationValid.mockReturnValue(true);

    const result = await requireElevatedAdmin();

    expect(result.authorized).toBe(true);
    expect(result.elevated).toBe(true);
    expect(result.user).toBeDefined();
  });

  it('should authorize SUPER_ADMIN with 2FA elevation', async () => {
    mockCurrentUser.mockResolvedValue(clerkUser);
    mockFindUnique.mockResolvedValue(
      makeAdminUser({ role: 'SUPER_ADMIN', totpEnabled: true })
    );
    mockIsElevationValid.mockReturnValue(true);

    const result = await requireElevatedAdmin();
    expect(result.authorized).toBe(true);
    expect(result.elevated).toBe(true);
  });

  it('should authorize GOD role', async () => {
    mockCurrentUser.mockResolvedValue(clerkUser);
    mockFindUnique.mockResolvedValue(
      makeAdminUser({ role: 'GOD', totpEnabled: false })
    );

    const result = await requireElevatedAdmin();
    expect(result.authorized).toBe(true);
  });
});

describe('requireAdminWithElevationStatus', () => {
  it('should return unauthorized for non-admin', async () => {
    mockCurrentUser.mockResolvedValue(null as any);
    mockFindUnique.mockResolvedValue(null);

    const result = await requireAdminWithElevationStatus();
    expect(result.authorized).toBe(false);
  });

  it('should return elevated=false when 2FA not enabled', async () => {
    mockCurrentUser.mockResolvedValue(clerkUser);
    mockFindUnique.mockResolvedValue(makeAdminUser({ totpEnabled: false }));

    const result = await requireAdminWithElevationStatus();

    expect(result.authorized).toBe(true);
    expect(result.elevated).toBe(false);
  });

  it('should report elevation status when 2FA enabled', async () => {
    mockCurrentUser.mockResolvedValue(clerkUser);
    mockFindUnique.mockResolvedValue(makeAdminUser({ totpEnabled: true }));
    mockIsElevationValid.mockReturnValue(true);

    const result = await requireAdminWithElevationStatus();

    expect(result.authorized).toBe(true);
    expect(result.elevated).toBe(true);
  });

  it('should not return error response (read-only check)', async () => {
    mockCurrentUser.mockResolvedValue(clerkUser);
    mockFindUnique.mockResolvedValue(makeAdminUser({ totpEnabled: true }));
    mockIsElevationValid.mockReturnValue(false);

    const result = await requireAdminWithElevationStatus();

    // Unlike requireElevatedAdmin, this doesn't block with a response
    expect(result.authorized).toBe(true);
    expect(result.elevated).toBe(false);
    expect(result.response).toBeUndefined();
  });
});
