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

    if (!adminUser || !['ADMIN', 'MODERATOR', 'SUPPORT', 'GOD'].includes(adminUser.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { reviewId, responseText } = body;

    if (!reviewId || !responseText) {
      return NextResponse.json(
        { error: 'reviewId and responseText are required' },
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

    // Update review with response
    const updatedReview = await prisma.review.update({
      where: { id: parseInt(reviewId) },
      data: {
        responseText: responseText.trim(),
        responseBy: adminUser.displayName || adminUser.username || 'Full Uproar Team',
        responseAt: new Date(),
      }
    });

    return NextResponse.json({
      success: true,
      review: updatedReview,
      message: 'Response added successfully'
    });
  } catch (error) {
    console.error('Error responding to review:', error);
    return NextResponse.json(
      { error: 'Failed to add response' },
      { status: 500 }
    );
  }
}
