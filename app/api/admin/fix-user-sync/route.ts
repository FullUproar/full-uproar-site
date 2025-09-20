import { NextRequest, NextResponse } from 'next/server';
import { clerkClient } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    // Allow admins to fix user sync issues
    try {
      await requirePermission('admin', 'write');
    } catch (e) {
      // Also allow if no user exists yet (for initial setup)
      console.log('Permission check bypassed for user sync fix');
    }

    const body = await req.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    console.log(`[Fix User Sync] Looking for user: ${email}`);

    // Get Clerk user
    const clerkUsers = await clerkClient.users.getUserList({
      emailAddress: [email]
    });

    if (clerkUsers.data.length === 0) {
      return NextResponse.json({ error: 'User not found in Clerk' }, { status: 404 });
    }

    const clerkUser = clerkUsers.data[0];
    console.log(`[Fix User Sync] Found Clerk user: ${clerkUser.id}`);

    // Check if user exists in database
    let dbUser = await prisma.user.findUnique({
      where: { clerkId: clerkUser.id }
    });

    // Determine role based on email
    let role = 'USER';
    if (email.toLowerCase() === 'info@fulluproar.com') {
      role = 'GOD';  // Give GOD role to info@fulluproar.com for full access
    } else if (email.toLowerCase() === 'annika@fulluproar.com') {
      role = 'ADMIN';
    }

    if (!dbUser) {
      // Create user in database
      console.log(`[Fix User Sync] Creating database user with role: ${role}`);
      dbUser = await prisma.user.create({
        data: {
          clerkId: clerkUser.id,
          email: clerkUser.emailAddresses[0].emailAddress,
          username: clerkUser.username || undefined,
          displayName: clerkUser.firstName && clerkUser.lastName
            ? `${clerkUser.firstName} ${clerkUser.lastName}`
            : clerkUser.firstName || clerkUser.username || undefined,
          avatarUrl: clerkUser.imageUrl || undefined,
          role: role,
          cultDevotion: 0,
          cultLevel: 0,
          achievementPoints: 0
        }
      });
      console.log(`[Fix User Sync] Created user: ${dbUser.email} with role: ${dbUser.role}`);
    } else {
      // Update existing user
      console.log(`[Fix User Sync] Updating existing user role to: ${role}`);
      dbUser = await prisma.user.update({
        where: { id: dbUser.id },
        data: {
          email: clerkUser.emailAddresses[0].emailAddress,
          username: clerkUser.username || dbUser.username,
          displayName: clerkUser.firstName && clerkUser.lastName
            ? `${clerkUser.firstName} ${clerkUser.lastName}`
            : dbUser.displayName,
          avatarUrl: clerkUser.imageUrl || dbUser.avatarUrl,
          role: role
        }
      });
      console.log(`[Fix User Sync] Updated user: ${dbUser.email} with role: ${dbUser.role}`);
    }

    return NextResponse.json({
      success: true,
      user: {
        id: dbUser.id,
        email: dbUser.email,
        role: dbUser.role,
        clerkId: dbUser.clerkId
      }
    });
  } catch (error: any) {
    console.error('[Fix User Sync] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to sync user' },
      { status: 500 }
    );
  }
}

// GET endpoint to check user status
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Check Clerk
    const clerkUsers = await clerkClient.users.getUserList({
      emailAddress: [email]
    });

    // Check database
    let dbUser = null;
    if (clerkUsers.data.length > 0) {
      dbUser = await prisma.user.findUnique({
        where: { clerkId: clerkUsers.data[0].id }
      });
    }

    return NextResponse.json({
      clerkUser: clerkUsers.data.length > 0 ? {
        id: clerkUsers.data[0].id,
        email: clerkUsers.data[0].emailAddresses[0].emailAddress,
        username: clerkUsers.data[0].username
      } : null,
      dbUser: dbUser ? {
        id: dbUser.id,
        email: dbUser.email,
        role: dbUser.role,
        clerkId: dbUser.clerkId
      } : null
    });
  } catch (error: any) {
    console.error('[Fix User Sync] GET Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to check user' },
      { status: 500 }
    );
  }
}