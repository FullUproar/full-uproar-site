/**
 * Unit tests for requireAdmin and isAdmin (lib/auth/require-admin.ts)
 * Tests the admin gate used by every /api/admin/* route.
 */

// Mock Clerk
jest.mock('@clerk/nextjs/server', () => ({
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

import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin, isAdmin } from '@/lib/auth/require-admin';

const mockAuth = auth as jest.MockedFunction<typeof auth>;
const mockFindUnique = prisma.user.findUnique as jest.MockedFunction<any>;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('requireAdmin', () => {
  it('should return unauthorized when no userId', async () => {
    mockAuth.mockResolvedValue({ userId: null } as any);

    const result = await requireAdmin();

    expect(result.authorized).toBe(false);
    if (!result.authorized) {
      const body = await result.response.json();
      expect(body.error).toBe('Unauthorized');
    }
  });

  it('should return forbidden when user not found in DB', async () => {
    mockAuth.mockResolvedValue({ userId: 'clerk_123' } as any);
    mockFindUnique.mockResolvedValue(null);

    const result = await requireAdmin();

    expect(result.authorized).toBe(false);
    if (!result.authorized) {
      const body = await result.response.json();
      expect(body.error).toBe('Admin access required');
    }
  });

  it('should return forbidden for USER role', async () => {
    mockAuth.mockResolvedValue({ userId: 'clerk_123' } as any);
    mockFindUnique.mockResolvedValue({
      id: 'db-1',
      role: 'USER',
      email: 'user@test.com',
    });

    const result = await requireAdmin();
    expect(result.authorized).toBe(false);
  });

  it('should return forbidden for MODERATOR role', async () => {
    mockAuth.mockResolvedValue({ userId: 'clerk_123' } as any);
    mockFindUnique.mockResolvedValue({
      id: 'db-1',
      role: 'MODERATOR',
      email: 'mod@test.com',
    });

    const result = await requireAdmin();
    expect(result.authorized).toBe(false);
  });

  it('should authorize ADMIN role', async () => {
    mockAuth.mockResolvedValue({ userId: 'clerk_123' } as any);
    mockFindUnique.mockResolvedValue({
      id: 'db-1',
      role: 'ADMIN',
      email: 'admin@test.com',
    });

    const result = await requireAdmin();

    expect(result.authorized).toBe(true);
    if (result.authorized) {
      expect(result.userId).toBe('clerk_123');
      expect(result.user.role).toBe('ADMIN');
      expect(result.user.email).toBe('admin@test.com');
    }
  });

  it('should authorize SUPER_ADMIN role', async () => {
    mockAuth.mockResolvedValue({ userId: 'clerk_456' } as any);
    mockFindUnique.mockResolvedValue({
      id: 'db-2',
      role: 'SUPER_ADMIN',
      email: 'super@test.com',
    });

    const result = await requireAdmin();
    expect(result.authorized).toBe(true);
  });

  it('should authorize GOD role', async () => {
    mockAuth.mockResolvedValue({ userId: 'clerk_789' } as any);
    mockFindUnique.mockResolvedValue({
      id: 'db-3',
      role: 'GOD',
      email: 'god@test.com',
    });

    const result = await requireAdmin();
    expect(result.authorized).toBe(true);
  });

  it('should query user by clerkId', async () => {
    mockAuth.mockResolvedValue({ userId: 'clerk_specific' } as any);
    mockFindUnique.mockResolvedValue({
      id: 'db-1',
      role: 'ADMIN',
      email: 'admin@test.com',
    });

    await requireAdmin();

    expect(mockFindUnique).toHaveBeenCalledWith({
      where: { clerkId: 'clerk_specific' },
      select: { id: true, role: true, email: true },
    });
  });
});

describe('isAdmin', () => {
  it('should return true for admin users', async () => {
    mockAuth.mockResolvedValue({ userId: 'clerk_123' } as any);
    mockFindUnique.mockResolvedValue({
      id: 'db-1',
      role: 'ADMIN',
      email: 'admin@test.com',
    });

    const result = await isAdmin();
    expect(result).toBe(true);
  });

  it('should return false for non-admin users', async () => {
    mockAuth.mockResolvedValue({ userId: 'clerk_123' } as any);
    mockFindUnique.mockResolvedValue({
      id: 'db-1',
      role: 'USER',
      email: 'user@test.com',
    });

    const result = await isAdmin();
    expect(result).toBe(false);
  });

  it('should return false when not authenticated', async () => {
    mockAuth.mockResolvedValue({ userId: null } as any);

    const result = await isAdmin();
    expect(result).toBe(false);
  });
});
