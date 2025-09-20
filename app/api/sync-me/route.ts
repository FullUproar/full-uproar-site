import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth, currentUser } from '@clerk/nextjs/server';

export async function GET() {
  try {
    const { userId } = await auth();
    const clerkUser = await currentUser();

    if (!userId || !clerkUser) {
      return NextResponse.json({ error: 'Not logged in' }, { status: 401 });
    }

    const email = clerkUser.emailAddresses[0]?.emailAddress || '';

    // Determine role based on email
    let role = 'USER';
    if (email.toLowerCase() === 'info@fulluproar.com') {
      role = 'GOD';
    } else if (email.toLowerCase() === 'annika@fulluproar.com') {
      role = 'ADMIN';
    }

    // Check if user exists
    let user = await prisma.user.findUnique({
      where: { clerkId: userId }
    });

    if (!user) {
      // Create user if they don't exist
      const username = clerkUser.username || email.split('@')[0];

      user = await prisma.user.create({
        data: {
          clerkId: userId,
          email: email,
          username: username,
          displayName: clerkUser.firstName || username,
          role: role,
          emailVerified: clerkUser.emailAddresses[0]?.verification?.status === 'verified',
          cultDevotion: 0,
          cultLevel: 0,
          achievementPoints: 0
        }
      });
    } else {
      // Update existing user role
      user = await prisma.user.update({
        where: { clerkId: userId },
        data: {
          role: role,
          email: email // Update email in case it changed
        }
      });
    }

    return NextResponse.json({
      message: `User synced successfully with role: ${role}`,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        clerkId: user.clerkId
      }
    });
  } catch (error: any) {
    console.error('Error syncing user:', error);
    return NextResponse.json({
      error: 'Failed to sync user',
      details: error.message
    }, { status: 500 });
  }
}