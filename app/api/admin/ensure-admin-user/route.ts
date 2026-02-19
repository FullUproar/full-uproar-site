import { NextRequest, NextResponse } from 'next/server';
import { auth as getSession } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    // Get current session user
    const session = await getSession();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({
        error: 'Not authenticated. Please sign in first.'
      }, { status: 401 });
    }

    const email = session.user?.email;

    if (!email) {
      return NextResponse.json({
        error: 'No email address found in session'
      }, { status: 400 });
    }

    // Check if user exists
    let dbUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!dbUser) {
      // User doesn't exist, create them
      const username = email.split('@')[0];

      dbUser = await prisma.user.create({
        data: {
          id: userId,
          email: email,
          username: username || undefined,
          displayName: session.user?.name || undefined,
          avatarUrl: session.user?.image || undefined,
          role: email.toLowerCase() === 'info@fulluproar.com' ? 'ADMIN' : 'USER',
          cultDevotion: 0,
          cultLevel: 0,
          achievementPoints: 0
        }
      });

      return NextResponse.json({
        message: 'User created successfully',
        user: {
          id: dbUser.id,
          email: dbUser.email,
          role: dbUser.role,
        }
      });
    } else {
      // User exists, check if they need admin role
      if (email.toLowerCase() === 'info@fulluproar.com' && dbUser.role !== 'ADMIN') {
        dbUser = await prisma.user.update({
          where: { id: dbUser.id },
          data: { role: 'ADMIN' }
        });

        return NextResponse.json({
          message: 'User updated to ADMIN role',
          user: {
            id: dbUser.id,
            email: dbUser.email,
            role: dbUser.role,
          }
        });
      }

      return NextResponse.json({
        message: 'User already exists with correct role',
        user: {
          id: dbUser.id,
          email: dbUser.email,
          role: dbUser.role,
        }
      });
    }
  } catch (error) {
    console.error('Ensure admin user error:', error);
    return NextResponse.json({
      error: 'Failed to ensure admin user',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
