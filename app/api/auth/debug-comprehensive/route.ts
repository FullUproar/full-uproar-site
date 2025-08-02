import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, checkPermission } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Get Clerk auth info
    const { userId: clerkUserId } = await auth();
    const clerkUser = await currentUser();
    
    // Get database user - IMPORTANT: Use clerkId, not id!
    const dbUser = clerkUserId ? await prisma.user.findUnique({
      where: { clerkId: clerkUserId },
      include: {
        permissions: true
      }
    }) : null;

    // Permission checks
    const permissionChecks = {
      hasUser: !!dbUser,
      hasAdmin: dbUser?.role === 'ADMIN' || dbUser?.role === 'SUPER_ADMIN',
      hasSuperAdmin: dbUser?.role === 'SUPER_ADMIN',
      canAccessAdmin: false,
      canCreateGames: false,
      canSeedForum: false
    };

    // Test specific permissions if user exists
    if (dbUser) {
      try {
        // Test admin access
        const adminCheck = await checkPermission('admin:access');
        permissionChecks.canAccessAdmin = adminCheck;

        // Test game creation
        const gameCheck = await checkPermission('games:create');
        permissionChecks.canCreateGames = gameCheck;

        // For forum seeding, we just check if they're admin
        permissionChecks.canSeedForum = permissionChecks.hasAdmin;
      } catch (err) {
        console.error('Permission check error:', err);
      }
    }

    // Auth function tests
    const authTests = {
      getCurrentUserWorks: false,
      checkPermissionWorks: false,
      requirePermissionWorks: false,
      error: ''
    };

    try {
      // Test getCurrentUser
      const currentUserTest = await getCurrentUser();
      authTests.getCurrentUserWorks = !!currentUserTest;

      // Test checkPermission
      if (dbUser) {
        const permTest = await checkPermission('admin:access');
        authTests.checkPermissionWorks = typeof permTest === 'boolean';
      }

      authTests.requirePermissionWorks = true; // Can't test without throwing
    } catch (err: any) {
      authTests.error = err.message;
    }

    // Database stats
    const totalUsers = await prisma.user.count();
    const totalAdmins = await prisma.user.count({
      where: {
        OR: [
          { role: 'ADMIN' },
          { role: 'SUPER_ADMIN' }
        ]
      }
    });

    // Check for clerkId mismatches (users with empty clerkId)
    const clerkIdMismatches = await prisma.user.count({
      where: {
        clerkId: ''
      }
    });

    return NextResponse.json({
      // Clerk Info
      clerkUserId,
      clerkEmail: clerkUser?.emailAddresses[0]?.emailAddress || null,
      clerkUsername: clerkUser?.username || null,
      clerkEmailVerified: clerkUser?.emailAddresses[0]?.verification?.status === 'verified',
      
      // Database Info
      dbUserExists: !!dbUser,
      dbUser: dbUser ? {
        id: dbUser.id,
        clerkId: dbUser.clerkId,
        email: dbUser.email,
        username: dbUser.username,
        role: dbUser.role,
        emailVerified: dbUser.emailVerified,
        isBanned: dbUser.isBanned,
        cultDevotion: dbUser.cultDevotion
      } : null,
      
      // Permission Checks
      permissionChecks,
      
      // Auth Function Tests
      authTests,
      
      // Database Stats
      totalUsers,
      totalAdmins,
      clerkIdMismatches
    });
  } catch (error: any) {
    console.error('Debug comprehensive error:', error);
    return NextResponse.json({
      error: 'Failed to fetch debug info',
      details: error.message
    }, { status: 500 });
  }
}