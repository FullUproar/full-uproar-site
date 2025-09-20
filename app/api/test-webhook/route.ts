import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';

export async function POST(req: Request) {
  try {
    // Check if user is authenticated and is admin
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Get the user and verify they're an admin
    const user = await prisma.user.findUnique({
      where: { clerkId: userId }
    });

    if (!user || (user.role !== 'ADMIN' && user.role !== 'GOD')) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const { clerkId, email } = await req.json();

    console.log('[TEST WEBHOOK] Manually creating user:', email);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { clerkId }
    });

    if (existingUser) {
      console.log('[TEST WEBHOOK] User already exists:', existingUser.email);
      return NextResponse.json({
        message: 'User already exists',
        user: existingUser
      });
    }

    // Determine role
    const adminEmails = ['info@fulluproar.com', 'annika@fulluproar.com'];
    const isAdminEmail = adminEmails.includes(email.toLowerCase());

    // Create the user
    const newUser = await prisma.user.create({
      data: {
        clerkId,
        email,
        username: email.split('@')[0],
        displayName: email.split('@')[0],
        role: isAdminEmail ? 'ADMIN' : 'USER',
        cultDevotion: 0,
        cultLevel: 0,
        achievementPoints: 0
      }
    });

    console.log('[TEST WEBHOOK] User created successfully:', newUser.email);

    return NextResponse.json({
      success: true,
      message: 'User created successfully',
      user: newUser
    });

  } catch (error) {
    console.error('[TEST WEBHOOK] Error:', error);
    return NextResponse.json({
      error: 'Failed to create user',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// GET endpoint to check webhook configuration
export async function GET() {
  try {
    const hasWebhookSecret = !!process.env.CLERK_WEBHOOK_SECRET;
    const secretLength = process.env.CLERK_WEBHOOK_SECRET?.length || 0;

    // Count users in database
    const userCount = await prisma.user.count();
    const recentUsers = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        email: true,
        clerkId: true,
        createdAt: true,
        role: true
      }
    });

    return NextResponse.json({
      webhookConfig: {
        hasSecret: hasWebhookSecret,
        secretLength,
        secretPrefix: process.env.CLERK_WEBHOOK_SECRET?.substring(0, 10) + '...',
      },
      database: {
        totalUsers: userCount,
        recentUsers
      },
      endpoints: {
        main: '/api/webhooks/clerk',
        debug: '/api/webhooks/clerk-debug',
        test: '/api/test-webhook',
        syncMe: '/api/sync-me'
      },
      instructions: 'Use POST with {clerkId, email} to manually create a user'
    });
  } catch (error) {
    console.error('[TEST WEBHOOK] GET Error:', error);
    return NextResponse.json({
      error: 'Failed to get webhook info',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}