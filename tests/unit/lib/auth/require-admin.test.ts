/**
 * @jest-environment node
 */

/**
 * Unit tests for requireAdmin and isAdmin (lib/auth/require-admin.ts)
 * Tests the admin gate used by every /api/admin/* route.
 */

// Mock Auth.js
jest.mock('@/lib/auth-config', () => ({
  auth: jest.fn(),
}));

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
  },
}));

import { auth } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';
import { requireAdmin, isAdmin } from '@/lib/auth/require-admin';

const mockAuth = auth as jest.MockedFunction<typeof auth>;
const mockFindUnique = prisma.user.findUnique as jest.MockedFunction<any>;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('requireAdmin', () => {
  it('should return unauthorized when no session', async () => {
    mockAuth.mockResolvedValue(null as any);

    const result = await requireAdmin();

    expect(result.authorized).toBe(false);
    if (!result.authorized) {
      const body = await result.response.json();
      expect(body.error).toBe('Unauthorized');
    }
  });

  it('should return forbidden when user not found in DB', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'db-1', role: 'ADMIN' } } as any);
    mockFindUnique.mockResolvedValue(null);

    const result = await requireAdmin();

    expect(result.authorized).toBe(false);
    if (!result.authorized) {
      const body = await result.response.json();
      expect(body.error).toBe('Admin access required');
    }
  });

  it('should return forbidden for USER role', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'db-1', role: 'USER' } } as any);
    mockFindUnique.mockResolvedValue({
      id: 'db-1',
      role: 'USER',
      email: 'user@test.com',
    });

    const result = await requireAdmin();
    expect(result.authorized).toBe(false);
  });

  it('should return forbidden for MODERATOR role', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'db-1', role: 'MODERATOR' } } as any);
    mockFindUnique.mockResolvedValue({
      id: 'db-1',
      role: 'MODERATOR',
      email: 'mod@test.com',
    });

    const result = await requireAdmin();
    expect(result.authorized).toBe(false);
  });

  it('should authorize ADMIN role', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'db-1', role: 'ADMIN' } } as any);
    mockFindUnique.mockResolvedValue({
      id: 'db-1',
      role: 'ADMIN',
      email: 'admin@test.com',
    });

    const result = await requireAdmin();

    expect(result.authorized).toBe(true);
    if (result.authorized) {
      expect(result.userId).toBe('db-1');
      expect(result.user.role).toBe('ADMIN');
      expect(result.user.email).toBe('admin@test.com');
    }
  });

  it('should authorize SUPER_ADMIN role', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'db-2', role: 'SUPER_ADMIN' } } as any);
    mockFindUnique.mockResolvedValue({
      id: 'db-2',
      role: 'SUPER_ADMIN',
      email: 'super@test.com',
    });

    const result = await requireAdmin();
    expect(result.authorized).toBe(true);
  });

  it('should authorize GOD role', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'db-3', role: 'GOD' } } as any);
    mockFindUnique.mockResolvedValue({
      id: 'db-3',
      role: 'GOD',
      email: 'god@test.com',
    });

    const result = await requireAdmin();
    expect(result.authorized).toBe(true);
  });

  it('should query user by id', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'db-specific', role: 'ADMIN' } } as any);
    mockFindUnique.mockResolvedValue({
      id: 'db-specific',
      role: 'ADMIN',
      email: 'admin@test.com',
    });

    await requireAdmin();

    expect(mockFindUnique).toHaveBeenCalledWith({
      where: { id: 'db-specific' },
      select: { id: true, role: true, email: true },
    });
  });
});

describe('isAdmin', () => {
  it('should return true for admin users', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'db-1', role: 'ADMIN' } } as any);
    mockFindUnique.mockResolvedValue({
      id: 'db-1',
      role: 'ADMIN',
      email: 'admin@test.com',
    });

    const result = await isAdmin();
    expect(result).toBe(true);
  });

  it('should return false for non-admin users', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'db-1', role: 'USER' } } as any);
    mockFindUnique.mockResolvedValue({
      id: 'db-1',
      role: 'USER',
      email: 'user@test.com',
    });

    const result = await isAdmin();
    expect(result).toBe(false);
  });

  it('should return false when not authenticated', async () => {
    mockAuth.mockResolvedValue(null as any);

    const result = await isAdmin();
    expect(result).toBe(false);
  });
});
