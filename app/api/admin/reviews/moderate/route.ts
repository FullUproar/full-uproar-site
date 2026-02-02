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
      select: { id: true, role: true, displayName: true, username: true }
    });

    if (!adminUser || !['ADMIN', 'MODERATOR', 'SUPPORT', 'GOD'].includes(adminUser.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { reviewId, action, reason } = body;

    if (!reviewId || !action) {
      return NextResponse.json(
        { error: 'reviewId and action are required' },
        { status: 400 }
      );
    }

    // Validate action
    const validActions = ['approved', 'rejected', 'flagged', 'pending'];
    if (!validActions.includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      );
    }

    // Check if review exists
    const review = await prisma.review.findUnique({
      where: { id: parseInt(reviewId) }
    });

    if (!review) {
      return NextResponse.json(
        { error: 'Review not found' },
        { status: 404 }
      );
    }

    // Update review
    const updatedReview = await prisma.review.update({
      where: { id: parseInt(reviewId) },
      data: {
        status: action,
        moderatedBy: adminUser.displayName || adminUser.username || userId,
        moderatedAt: new Date(),
        rejectionReason: action === 'rejected' ? reason : null,
      }
    });

    return NextResponse.json({
      success: true,
      review: updatedReview,
      message: `Review ${action} successfully`
    });
  } catch (error) {
    console.error('Error moderating review:', error);
    return NextResponse.json(
      { error: 'Failed to moderate review' },
      { status: 500 }
    );
  }
}
