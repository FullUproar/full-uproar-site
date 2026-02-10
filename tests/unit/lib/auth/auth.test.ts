/**
 * Unit tests for auth helpers (lib/auth.ts)
 * Mocks Clerk's auth() and currentUser() to test our auth logic in isolation.
 *
 * Covers workflows: #16-21 (Account & Auth) — the parts we own
 * Strategy: Mock the auth provider, test our permission/role logic directly
 */

import { UserRole } from '@prisma/client';

// Mock Clerk before importing auth module
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

import { auth, currentUser } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, checkPermission, requireAuth, requirePermission } from '@/lib/auth';

const mockAuth = auth as jest.MockedFunction<typeof auth>;
const mockCurrentUser = currentUser as jest.MockedFunction<typeof currentUser>;
const mockFindUnique = prisma.user.findUnique as jest.MockedFunction<any>;

// Test user fixtures
const clerkUser = {
  id: 'clerk_user_123',
  emailAddresses: [{ emailAddress: 'test@example.com' }],
  firstName: 'Test',
  lastName: 'User',
} as any;

const dbUserBase = {
  id: 'db-user-1',
  clerkId: 'clerk_user_123',
  email: 'test@example.com',
  role: UserRole.USER,
  permissions: [],
  profile: null,
};

function makeDbUser(overrides: Partial<typeof dbUserBase> = {}) {
  return { ...dbUserBase, ...overrides };
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('getCurrentUser', () => {
  it('should return null when Clerk user is not authenticated', async () => {
    mockCurrentUser.mockResolvedValue(null as any);
    const result = await getCurrentUser();
    expect(result).toBeNull();
    expect(mockFindUnique).not.toHaveBeenCalled();
  });

  it('should look up DB user by clerkId', async () => {
    mockCurrentUser.mockResolvedValue(clerkUser);
    mockFindUnique.mockResolvedValue(makeDbUser());

    const result = await getCurrentUser();

    expect(mockFindUnique).toHaveBeenCalledWith({
      where: { clerkId: 'clerk_user_123' },
      include: { permissions: true, profile: true },
    });
    expect(result).toEqual(makeDbUser());
  });

  it('should return null when DB user not found', async () => {
    mockCurrentUser.mockResolvedValue(clerkUser);
    mockFindUnique.mockResolvedValue(null);

    const result = await getCurrentUser();
    expect(result).toBeNull();
  });
});

describe('requireAuth', () => {
  it('should return userId when authenticated', async () => {
    mockAuth.mockResolvedValue({ userId: 'clerk_user_123' } as any);
    const result = await requireAuth();
    expect(result).toBe('clerk_user_123');
  });

  it('should throw when not authenticated', async () => {
    mockAuth.mockResolvedValue({ userId: null } as any);
    await expect(requireAuth()).rejects.toThrow('Unauthorized');
  });
});

describe('checkPermission', () => {
  it('should return false when user is not authenticated', async () => {
    mockCurrentUser.mockResolvedValue(null as any);
    const result = await checkPermission('admin', 'access');
    expect(result).toBe(false);
  });

  it('should grant all permissions to GOD role', async () => {
    mockCurrentUser.mockResolvedValue(clerkUser);
    mockFindUnique.mockResolvedValue(makeDbUser({ role: UserRole.GOD }));

    expect(await checkPermission('admin', 'access')).toBe(true);
    expect(await checkPermission('anything', 'whatever')).toBe(true);
  });

  it('should grant all permissions to SUPER_ADMIN role', async () => {
    mockCurrentUser.mockResolvedValue(clerkUser);
    mockFindUnique.mockResolvedValue(makeDbUser({ role: UserRole.SUPER_ADMIN }));

    expect(await checkPermission('admin', 'access')).toBe(true);
    expect(await checkPermission('users', 'delete')).toBe(true);
  });

  it('should grant role-based permissions to ADMIN', async () => {
    mockCurrentUser.mockResolvedValue(clerkUser);
    mockFindUnique.mockResolvedValue(makeDbUser({ role: UserRole.ADMIN }));

    // ADMIN has admin:*, users:read/create/update/delete, products:*, etc.
    expect(await checkPermission('admin', 'access')).toBe(true);
    expect(await checkPermission('products', 'create')).toBe(true);
    expect(await checkPermission('orders', 'read')).toBe(true);
    expect(await checkPermission('users', 'read')).toBe(true);
  });

  it('should limit MODERATOR to message and user moderation permissions', async () => {
    mockCurrentUser.mockResolvedValue(clerkUser);
    mockFindUnique.mockResolvedValue(makeDbUser({ role: UserRole.MODERATOR }));

    expect(await checkPermission('messages', 'read')).toBe(true);
    expect(await checkPermission('users', 'ban')).toBe(true);
    expect(await checkPermission('users', 'mute')).toBe(true);
    // Moderator should NOT have admin or product access
    expect(await checkPermission('admin', 'access')).toBe(false);
    expect(await checkPermission('products', 'create')).toBe(false);
  });

  it('should limit USER to basic permissions', async () => {
    mockCurrentUser.mockResolvedValue(clerkUser);
    mockFindUnique.mockResolvedValue(makeDbUser({ role: UserRole.USER }));

    expect(await checkPermission('messages', 'create')).toBe(true);
    expect(await checkPermission('messages', 'read')).toBe(true);
    expect(await checkPermission('profile', 'update')).toBe(true);
    // USER should NOT have admin access
    expect(await checkPermission('admin', 'access')).toBe(false);
    expect(await checkPermission('users', 'delete')).toBe(false);
  });

  it('should handle colon notation (resource:action)', async () => {
    mockCurrentUser.mockResolvedValue(clerkUser);
    mockFindUnique.mockResolvedValue(makeDbUser({ role: UserRole.ADMIN }));

    expect(await checkPermission('admin:access')).toBe(true);
    expect(await checkPermission('products:create')).toBe(true);
  });

  it('should check individual permissions from DB', async () => {
    mockCurrentUser.mockResolvedValue(clerkUser);
    mockFindUnique.mockResolvedValue(
      makeDbUser({
        role: UserRole.USER,
        permissions: [
          {
            id: 1,
            resource: 'special_feature',
            action: 'access',
            granted: true,
            expiresAt: null,
          },
        ] as any,
      })
    );

    expect(await checkPermission('special_feature', 'access')).toBe(true);
  });

  it('should reject expired individual permissions', async () => {
    mockCurrentUser.mockResolvedValue(clerkUser);
    mockFindUnique.mockResolvedValue(
      makeDbUser({
        role: UserRole.USER,
        permissions: [
          {
            id: 1,
            resource: 'special_feature',
            action: 'access',
            granted: true,
            expiresAt: new Date('2020-01-01'), // expired
          },
        ] as any,
      })
    );

    expect(await checkPermission('special_feature', 'access')).toBe(false);
  });

  it('should reject revoked individual permissions', async () => {
    mockCurrentUser.mockResolvedValue(clerkUser);
    mockFindUnique.mockResolvedValue(
      makeDbUser({
        role: UserRole.USER,
        permissions: [
          {
            id: 1,
            resource: 'special_feature',
            action: 'access',
            granted: false, // revoked
            expiresAt: null,
          },
        ] as any,
      })
    );

    expect(await checkPermission('special_feature', 'access')).toBe(false);
  });
});

describe('requirePermission', () => {
  it('should return user when permission is granted', async () => {
    mockCurrentUser.mockResolvedValue(clerkUser);
    mockFindUnique.mockResolvedValue(makeDbUser({ role: UserRole.ADMIN }));

    const result = await requirePermission('admin', 'access');
    expect(result).toEqual(makeDbUser({ role: UserRole.ADMIN }));
  });

  it('should throw Unauthorized when not authenticated', async () => {
    mockCurrentUser.mockResolvedValue(null as any);
    await expect(requirePermission('admin', 'access')).rejects.toThrow('Unauthorized');
  });

  it('should throw Forbidden when permission denied', async () => {
    mockCurrentUser.mockResolvedValue(clerkUser);
    mockFindUnique.mockResolvedValue(makeDbUser({ role: UserRole.USER }));

    await expect(requirePermission('admin', 'access')).rejects.toThrow('Forbidden');
  });

  it('should handle colon notation', async () => {
    mockCurrentUser.mockResolvedValue(clerkUser);
    mockFindUnique.mockResolvedValue(makeDbUser({ role: UserRole.ADMIN }));

    const result = await requirePermission('orders:read');
    expect(result).toEqual(makeDbUser({ role: UserRole.ADMIN }));
  });
});
