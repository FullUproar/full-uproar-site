import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

export async function POST() {
  try {
    const { userId: clerkUserId } = await auth();
    const clerkUser = await currentUser();
    
    if (!clerkUserId || !clerkUser) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Check if user exists using clerkId
    let dbUser = await prisma.user.findUnique({
      where: { clerkId: clerkUserId }
    });

    if (!dbUser) {
      // Also check by email in case there's a mismatch
      const email = clerkUser.emailAddresses[0]?.emailAddress;
      if (email) {
        dbUser = await prisma.user.findUnique({
          where: { email }
        });
        
        // If found by email but clerkId doesn't match, update it
        if (dbUser && dbUser.clerkId !== clerkUserId) {
          dbUser = await prisma.user.update({
            where: { id: dbUser.id },
            data: { clerkId: clerkUserId }
          });
        }
      }
    }

    if (!dbUser) {
      // Create new user
      const email = clerkUser.emailAddresses[0]?.emailAddress || '';
      const username = clerkUser.username || email.split('@')[0];
      
      dbUser = await prisma.user.create({
        data: {
          clerkId: clerkUserId,
          email: email,
          username: username,
          displayName: clerkUser.firstName || username,
          emailVerified: clerkUser.emailAddresses[0]?.verification?.status === 'verified',
          cultDevotion: 0,
          role: 'USER' // Default role
        }
      });
    } else {
      // Update existing user with latest Clerk data
      dbUser = await prisma.user.update({
        where: { id: dbUser.id },
        data: {
          email: clerkUser.emailAddresses[0]?.emailAddress || dbUser.email,
          emailVerified: clerkUser.emailAddresses[0]?.verification?.status === 'verified',
          displayName: clerkUser.firstName || dbUser.displayName,
          username: clerkUser.username || dbUser.username
        }
      });
    }

    return NextResponse.json({
      message: 'User synced successfully',
      user: {
        id: dbUser.id,
        clerkId: dbUser.clerkId,
        email: dbUser.email,
        role: dbUser.role
      }
    });
  } catch (error: any) {
    console.error('User sync error:', error);
    return NextResponse.json({
      error: 'Failed to sync user',
      details: error.message
    }, { status: 500 });
  }
}