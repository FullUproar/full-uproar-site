import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth, currentUser } from '@clerk/nextjs/server';

export async function POST() {
  try {
    const { userId } = await auth();
    const clerkUser = await currentUser();
    
    if (!userId || !clerkUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user exists
    let user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      // Create user if they don't exist
      const email = clerkUser.emailAddresses[0]?.emailAddress || '';
      const username = clerkUser.username || email.split('@')[0];
      
      user = await prisma.user.create({
        data: {
          id: userId,
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
        where: { id: userId },
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