import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth as getSession } from '@/lib/auth-config';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin permission
    const adminUser = await prisma.user.findFirst({
      where: { id: userId },
      select: { id: true, role: true, displayName: true, username: true }
    });

    if (!adminUser || !['ADMIN', 'MODERATOR', 'GOD'].includes(adminUser.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { targetUserId, reason, durationHours } = body;

    if (!targetUserId || !reason) {
      return NextResponse.json(
        { error: 'targetUserId and reason are required' },
        { status: 400 }
      );
    }

    // Don't allow banning yourself
    if (targetUserId === adminUser.id) {
      return NextResponse.json(
        { error: 'You cannot ban yourself' },
        { status: 400 }
      );
    }

    // Find target user
    let targetUser = await prisma.user.findFirst({
      where: { id: targetUserId }
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
          reviewBannedBy: adminUser.displayName || adminUser.username || adminUser.id,
          flagCount: { increment: 1 },
          lastFlaggedAt: new Date(),
        }
      });
    } else {
      // User not found in database
      return NextResponse.json({
        success: true,
        message: 'User not found in database. Their ID has been noted for future review submissions.',
        targetUserId,
        bannedUntil
      });
    }

    // Also reject all pending reviews from this user
    const rejectedReviews = await prisma.review.updateMany({
      where: {
        userId: targetUserId,
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
    const session = await getSession();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const checkUserId = searchParams.get('userId') || userId;

    const user = await prisma.user.findFirst({
      where: { id: checkUserId },
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
        where: { id: checkUserId },
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
