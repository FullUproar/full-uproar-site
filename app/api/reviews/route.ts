import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';
import { currentUser } from '@clerk/nextjs/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const gameId = searchParams.get('gameId');
    const merchId = searchParams.get('merchId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    const where = gameId ? { gameId: parseInt(gameId) } : 
                 merchId ? { merchId: parseInt(merchId) } : {};

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.review.count({ where })
    ]);

    // Calculate average rating
    const avgRating = await prisma.review.aggregate({
      where,
      _avg: { rating: true }
    });

    // Get rating distribution
    const distribution = await prisma.review.groupBy({
      by: ['rating'],
      where,
      _count: true
    });

    return NextResponse.json({
      reviews,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      averageRating: avgRating._avg.rating || 0,
      ratingDistribution: distribution.reduce((acc, item) => {
        acc[item.rating] = item._count;
        return acc;
      }, {} as Record<number, number>)
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reviews' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Must be logged in to review' },
        { status: 401 }
      );
    }

    const user = await currentUser();
    const body = await request.json();
    const { gameId, merchId, rating, title, comment } = body;

    // Validate rating
    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      );
    }

    // Check if user already reviewed this product
    const existingReview = await prisma.review.findFirst({
      where: {
        userId,
        ...(gameId ? { gameId: parseInt(gameId) } : { merchId: parseInt(merchId) })
      }
    });

    if (existingReview) {
      return NextResponse.json(
        { error: 'You have already reviewed this product' },
        { status: 400 }
      );
    }

    // Check if user purchased this product
    const hasPurchased = await prisma.orderItem.findFirst({
      where: {
        order: {
          customerEmail: user?.emailAddresses[0]?.emailAddress,
          status: { in: ['processing', 'shipped', 'delivered'] }
        },
        ...(gameId ? { gameId: parseInt(gameId) } : { merchId: parseInt(merchId) })
      }
    });

    const review = await prisma.review.create({
      data: {
        userId,
        userName: user?.firstName || user?.username || 'Anonymous',
        rating,
        title,
        comment,
        verified: !!hasPurchased,
        ...(gameId ? { gameId: parseInt(gameId) } : { merchId: parseInt(merchId) })
      }
    });

    // Track the review activity
    await prisma.userActivity.create({
      data: {
        userId,
        action: 'review',
        targetType: gameId ? 'game' : 'merch',
        targetId: parseInt(gameId || merchId),
        metadata: JSON.stringify({ rating })
      }
    });

    return NextResponse.json(review);
  } catch (error) {
    console.error('Error creating review:', error);
    return NextResponse.json(
      { error: 'Failed to create review' },
      { status: 500 }
    );
  }
}

// Vote on review helpfulness
export async function PATCH(request: NextRequest) {
  try {
    const { userId } = await auth();
    const body = await request.json();
    const { reviewId, vote } = body;

    if (!['helpful', 'unhelpful'].includes(vote)) {
      return NextResponse.json(
        { error: 'Invalid vote type' },
        { status: 400 }
      );
    }

    const review = await prisma.review.update({
      where: { id: parseInt(reviewId) },
      data: {
        [vote]: { increment: 1 }
      }
    });

    return NextResponse.json(review);
  } catch (error) {
    console.error('Error voting on review:', error);
    return NextResponse.json(
      { error: 'Failed to vote on review' },
      { status: 500 }
    );
  }
}