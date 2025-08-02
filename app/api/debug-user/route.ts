import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth, currentUser } from '@clerk/nextjs/server';

export async function GET() {
  try {
    const { userId } = await auth();
    const clerkUser = await currentUser();
    
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Check if user exists in database
    const dbUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    // Get user count
    const userCount = await prisma.user.count();

    return NextResponse.json({
      clerkUserId: userId,
      clerkEmail: clerkUser?.emailAddresses[0]?.emailAddress,
      dbUserExists: !!dbUser,
      dbUser: dbUser ? {
        id: dbUser.id,
        email: dbUser.email,
        role: dbUser.role,
        createdAt: dbUser.createdAt
      } : null,
      totalUsersInDb: userCount
    });
  } catch (error: any) {
    console.error('Debug user error:', error);
    return NextResponse.json({ 
      error: 'Failed to debug user',
      details: error.message 
    }, { status: 500 });
  }
}