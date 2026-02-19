import { NextRequest, NextResponse } from 'next/server';
import { auth as getSession } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Get session user
    const session = await getSession();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({
        error: 'Not authenticated'
      }, { status: 401 });
    }

    // Try to find database user
    let dbUser = null;
    try {
      dbUser = await prisma.user.findUnique({
        where: { id: userId }
      });
    } catch (dbError) {
      console.error('Database error:', dbError);
    }

    return NextResponse.json({
      session: {
        id: userId,
        email: session.user?.email || 'No email',
        name: session.user?.name,
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
