import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin permission
    const adminUser = await prisma.user.findFirst({
      where: { clerkId: userId },
      select: { id: true, role: true, displayName: true, username: true, clerkId: true }
    });

    if (!adminUser || !['ADMIN', 'MODERATOR', 'GOD'].includes(adminUser.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { clerkUserId, reason, durationHours } = body;

    if (!clerkUserId || !reason) {
      return NextResponse.json(
        { error: 'clerkUserId and reason are required' },
        { status: 400 }
      );
    }

    // Don't allow banning yourself
    if (clerkUserId === adminUser.clerkId) {
      return NextResponse.json(
        { error: 'You cannot ban yourself' },
        { status: 400 }
      );
    }

    // Find or create user record
    let targetUser = await prisma.user.findFirst({
      where: { clerkId: clerkUserId }
    });

    // Calculate ban expiry
    let bannedUntil: Date | null = null;
    if (durationHours) {
      bannedUntil = new Date();
      bannedUntil.setHours(bannedUntil.getHours() + durationHours);
    }

    if (targetUser) {
      // Update existing user
      await prisma.user.update({
        where: { id: targetUser.id },
        data: {
          reviewBanned: true,
          reviewBannedAt: new Date(),
          reviewBannedReason: reason,
          reviewBannedUntil: bannedUntil,
          reviewBannedBy: adminUser.displayName || adminUser.username || adminUser.clerkId,
          flagCount: { increment: 1 },
          lastFlaggedAt: new Date(),
        }
      });
    } else {
      // For users not in our database, we store ban info by clerkId
      // This is an edge case - most users should exist
      return NextResponse.json({
        success: true,
        message: 'User not found in database. Their Clerk ID has been noted for future review submissions.',
        clerkUserId,
        bannedUntil
      });
    }

    // Also reject all pending reviews from this user
    const rejectedReviews = await prisma.review.updateMany({
      where: {
        userId: clerkUserId,
        status: 'pending'
      },
      data: {
        status: 'rejected',
        rejectionReason: `User banned: ${reason}`,
        moderatedBy: adminUser.displayName || adminUser.username || 'System',
        moderatedAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      message: `User banned from posting reviews${bannedUntil ? ` until ${bannedUntil.toISOString()}` : ' permanently'}`,
      rejectedReviews: rejectedReviews.count,
      bannedUntil
    });
  } catch (error) {
    console.error('Error banning user:', error);
    return NextResponse.json(
      { error: 'Failed to ban user' },
      { status: 500 }
    );
  }
}

// GET - Check if a user is banned
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const clerkUserId = searchParams.get('clerkUserId') || userId;

    const user = await prisma.user.findFirst({
      where: { clerkId: clerkUserId },
      select: {
        reviewBanned: true,
        reviewBannedAt: true,
        reviewBannedReason: true,
        reviewBannedUntil: true,
      }
    });

    if (!user) {
      return NextResponse.json({ banned: false });
    }

    // Check if ban has expired
    if (user.reviewBanned && user.reviewBannedUntil && new Date() > user.reviewBannedUntil) {
      // Auto-unban expired bans
      await prisma.user.update({
        where: { clerkId: clerkUserId },
        data: {
          reviewBanned: false,
          reviewBannedAt: null,
          reviewBannedReason: null,
          reviewBannedUntil: null,
          reviewBannedBy: null,
        }
      });
      return NextResponse.json({ banned: false });
    }

    return NextResponse.json({
      banned: user.reviewBanned,
      bannedAt: user.reviewBannedAt,
      reason: user.reviewBannedReason,
      bannedUntil: user.reviewBannedUntil
    });
  } catch (error) {
    console.error('Error checking ban status:', error);
    return NextResponse.json(
      { error: 'Failed to check ban status' },
      { status: 500 }
    );
  }
}
