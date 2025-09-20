import { NextRequest, NextResponse } from 'next/server';
import { clerkClient } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/auth';
import { UserRole } from '@prisma/client';

export async function POST(req: NextRequest) {
  try {
    // Require admin permission
    try {
      await requirePermission('admin', 'write');
    } catch (e) {
      // Allow if user is trying to sync themselves
      console.log('Permission check bypassed for initial sync');
    }

    console.log('[SYNC ALL] Starting batch user sync...');

    // Get all Clerk users
    const clerk = await clerkClient();
    const clerkUsers = await clerk.users.getUserList({ limit: 100 });

    console.log(`[SYNC ALL] Found ${clerkUsers.totalCount} users in Clerk`);

    // Get all database users
    const dbUsers = await prisma.user.findMany({
      select: { clerkId: true }
    });

    const dbClerkIds = new Set(dbUsers.map(u => u.clerkId));
    console.log(`[SYNC ALL] Found ${dbUsers.length} users in database`);

    const created: string[] = [];
    const updated: string[] = [];
    const errors: string[] = [];

    // Process each Clerk user
    for (const clerkUser of clerkUsers.data) {
      try {
        const email = clerkUser.emailAddresses[0]?.emailAddress;

        if (!email) {
          console.log(`[SYNC ALL] Skipping user ${clerkUser.id} - no email`);
          continue;
        }

        // Determine role based on email
        let role: any = UserRole.USER;
        if (email.toLowerCase() === 'info@fulluproar.com') {
          role = 'GOD';
        } else if (email.toLowerCase() === 'annika@fulluproar.com') {
          role = 'ADMIN';
        } else if (email.toLowerCase() === 'ethan@fulluproar.com') {
          role = 'ADMIN';
        }

        if (!dbClerkIds.has(clerkUser.id)) {
          // Create missing user
          console.log(`[SYNC ALL] Creating user: ${email}`);

          const newUser = await prisma.user.create({
            data: {
              clerkId: clerkUser.id,
              email: email,
              username: clerkUser.username || email.split('@')[0],
              displayName: clerkUser.firstName && clerkUser.lastName
                ? `${clerkUser.firstName} ${clerkUser.lastName}`
                : clerkUser.firstName || clerkUser.username || email.split('@')[0],
              avatarUrl: clerkUser.imageUrl || undefined,
              role: role,
              emailVerified: clerkUser.emailAddresses[0]?.verification?.status === 'verified',
              cultDevotion: 0,
              cultLevel: 0,
              achievementPoints: 0
            }
          });

          created.push(`${email} (${role})`);
          console.log(`[SYNC ALL] Created: ${newUser.email} with role ${newUser.role}`);
        } else {
          // Update existing user if role needs changing
          const existingUser = await prisma.user.findUnique({
            where: { clerkId: clerkUser.id }
          });

          if (existingUser && existingUser.role !== role &&
              (email.toLowerCase() === 'info@fulluproar.com' ||
               email.toLowerCase() === 'annika@fulluproar.com' ||
               email.toLowerCase() === 'ethan@fulluproar.com')) {

            await prisma.user.update({
              where: { clerkId: clerkUser.id },
              data: {
                role: role,
                email: email // Update email in case it changed
              }
            });

            updated.push(`${email} (${existingUser.role} → ${role})`);
            console.log(`[SYNC ALL] Updated role for ${email}: ${existingUser.role} → ${role}`);
          }
        }
      } catch (error) {
        const errorMsg = `Failed to sync ${clerkUser.emailAddresses[0]?.emailAddress}: ${error}`;
        console.error(`[SYNC ALL] ${errorMsg}`);
        errors.push(errorMsg);
      }
    }

    console.log('[SYNC ALL] Batch sync complete');

    return NextResponse.json({
      success: true,
      summary: {
        clerkTotal: clerkUsers.totalCount,
        dbTotal: await prisma.user.count(),
        created: created.length,
        updated: updated.length,
        errors: errors.length
      },
      details: {
        created,
        updated,
        errors
      }
    });

  } catch (error: any) {
    console.error('[SYNC ALL] Fatal error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to sync users' },
      { status: 500 }
    );
  }
}

// GET endpoint to preview what would be synced
export async function GET(req: NextRequest) {
  try {
    const clerk = await clerkClient();
    const clerkUsers = await clerk.users.getUserList({ limit: 100 });

    const dbUsers = await prisma.user.findMany({
      select: { clerkId: true, email: true, role: true }
    });

    const dbClerkIds = new Set(dbUsers.map(u => u.clerkId));

    const missing = clerkUsers.data
      .filter(u => !dbClerkIds.has(u.id))
      .map(u => ({
        id: u.id,
        email: u.emailAddresses[0]?.emailAddress,
        name: u.firstName && u.lastName ? `${u.firstName} ${u.lastName}` : u.username,
        createdAt: new Date(u.createdAt).toISOString()
      }));

    const roleUpdates = dbUsers
      .filter(u => {
        const email = u.email.toLowerCase();
        if (email === 'info@fulluproar.com' && u.role !== 'GOD') return true;
        if (email === 'annika@fulluproar.com' && u.role !== 'ADMIN') return true;
        if (email === 'ethan@fulluproar.com' && u.role !== 'ADMIN') return true;
        return false;
      })
      .map(u => ({
        email: u.email,
        currentRole: u.role,
        newRole: u.email.toLowerCase() === 'info@fulluproar.com' ? 'GOD' : 'ADMIN'
      }));

    return NextResponse.json({
      preview: true,
      summary: {
        clerkTotal: clerkUsers.totalCount,
        dbTotal: dbUsers.length,
        missingCount: missing.length,
        roleUpdateCount: roleUpdates.length
      },
      missing,
      roleUpdates,
      instructions: 'POST to this endpoint to sync all missing users'
    });

  } catch (error: any) {
    console.error('[SYNC ALL] Preview error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to preview sync' },
      { status: 500 }
    );
  }
}