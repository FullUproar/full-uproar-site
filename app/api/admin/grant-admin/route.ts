import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth, currentUser } from '@clerk/nextjs/server';

// Authorized admin emails that can self-grant (for initial setup)
const AUTHORIZED_ADMIN_EMAILS = [
  'info@fulluproar.com',
];

export async function POST() {
  try {
    const { userId } = await auth();
    const clerkUser = await currentUser();

    if (!userId || !clerkUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const email = clerkUser.emailAddresses[0]?.emailAddress?.toLowerCase() || '';

    // Security: Only allow this endpoint in specific conditions
    const isDevelopment = process.env.NODE_ENV === 'development';
    const isAuthorizedEmail = AUTHORIZED_ADMIN_EMAILS.includes(email);

    // Check if any admins exist
    const existingAdminCount = await prisma.user.count({
      where: { role: 'ADMIN' }
    });
    const noAdminsExist = existingAdminCount === 0;

    // Only allow if: in development, OR authorized email, OR no admins exist (first-time setup)
    if (!isDevelopment && !isAuthorizedEmail && !noAdminsExist) {
      return NextResponse.json({
        error: 'Access denied. This endpoint is restricted.'
      }, { status: 403 });
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
          role: 'ADMIN',
          emailVerified: clerkUser.emailAddresses[0]?.verification?.status === 'verified',
          cultDevotion: 0
        }
      });
    } else {
      // Update existing user to admin
      user = await prisma.user.update({
        where: { clerkId: userId },
        data: { role: 'ADMIN' }
      });
    }

    return NextResponse.json({
      message: 'Admin access granted',
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      }
    });
  } catch (error: any) {
    console.error('Error granting admin access:', error);
    return NextResponse.json({
      error: 'Failed to grant admin access',
      details: error.message
    }, { status: 500 });
  }
}