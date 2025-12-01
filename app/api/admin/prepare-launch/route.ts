import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';

// Admin-only endpoint to prepare site for pre-launch state
// Sets all games to 0 stock and marks them as preorder with Spring 2026 launch

export async function POST() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify admin role
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { role: true }
    });

    if (user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Update all games to preorder state with 0 stock
    const result = await prisma.game.updateMany({
      data: {
        stock: 0,
        isPreorder: true,
        launchDate: new Date('2026-04-01') // Spring 2026
      }
    });

    return NextResponse.json({
      message: 'All games set to pre-launch state',
      gamesUpdated: result.count
    });
  } catch (error: any) {
    console.error('Error preparing launch:', error);
    return NextResponse.json({
      error: 'Failed to prepare launch state',
      details: error.message
    }, { status: 500 });
  }
}
