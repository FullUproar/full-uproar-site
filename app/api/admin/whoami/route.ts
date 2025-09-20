import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Get Clerk user
    const clerkUser = await currentUser();
    
    if (!clerkUser) {
      return NextResponse.json({ 
        error: 'Not authenticated with Clerk' 
      }, { status: 401 });
    }

    // Try to find database user
    let dbUser = null;
    try {
      dbUser = await prisma.user.findUnique({
        where: { clerkId: clerkUser.id }
      });
    } catch (dbError) {
      console.error('Database error:', dbError);
    }

    return NextResponse.json({
      clerk: {
        id: clerkUser.id,
        email: clerkUser.emailAddresses?.[0]?.emailAddress || 'No email',
        firstName: clerkUser.firstName,
        lastName: clerkUser.lastName
      },
      database: dbUser ? {
        id: dbUser.id,
        email: dbUser.email,
        role: dbUser.role,
        createdAt: dbUser.createdAt
      } : null,
      isAdmin: dbUser?.role === 'ADMIN' || dbUser?.role === 'GOD',
      isSuperAdmin: dbUser?.role === 'SUPER_ADMIN' || dbUser?.role === 'GOD',
      isGod: dbUser?.role === 'GOD'
    });
  } catch (error) {
    console.error('Whoami error:', error);
    return NextResponse.json({ 
      error: 'Failed to get user info',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}