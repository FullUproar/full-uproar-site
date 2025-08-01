import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    // Get current Clerk user
    const clerkUser = await currentUser();
    
    if (!clerkUser) {
      return NextResponse.json({ 
        error: 'Not authenticated with Clerk. Please sign in first.' 
      }, { status: 401 });
    }

    const email = clerkUser.emailAddresses?.[0]?.emailAddress;
    
    if (!email) {
      return NextResponse.json({ 
        error: 'No email address found in Clerk user' 
      }, { status: 400 });
    }

    // Check if user exists
    let dbUser = await prisma.user.findUnique({
      where: { clerkId: clerkUser.id }
    });

    if (!dbUser) {
      // User doesn't exist, create them
      dbUser = await prisma.user.create({
        data: {
          clerkId: clerkUser.id,
          email: email,
          username: clerkUser.username || undefined,
          displayName: clerkUser.firstName && clerkUser.lastName 
            ? `${clerkUser.firstName} ${clerkUser.lastName}` 
            : clerkUser.firstName || undefined,
          avatarUrl: clerkUser.imageUrl || undefined,
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
          clerkId: dbUser.clerkId
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
            clerkId: dbUser.clerkId
          }
        });
      }

      return NextResponse.json({
        message: 'User already exists with correct role',
        user: {
          id: dbUser.id,
          email: dbUser.email,
          role: dbUser.role,
          clerkId: dbUser.clerkId
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