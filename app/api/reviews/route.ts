import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth as getSession } from '@/lib/auth-config';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const gameId = searchParams.get('gameId');
    const merchId = searchParams.get('merchId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const sort = searchParams.get('sort') || 'newest'; // newest, helpful, rating_high, rating_low

    const where = {
      ...(gameId ? { gameId: parseInt(gameId) } : {}),
      ...(merchId ? { merchId: parseInt(merchId) } : {}),
      status: 'approved', // Only show approved reviews
    };

    // Determine sort order
    let orderBy: Record<string, string> = { createdAt: 'desc' };
    if (sort === 'helpful') {
      orderBy = { helpful: 'desc' };
    } else if (sort === 'rating_high') {
      orderBy = { rating: 'desc' };
    } else if (sort === 'rating_low') {
      orderBy = { rating: 'asc' };
    }

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          userId: true,
          userName: true,
          rating: true,
          title: true,
          comment: true,
          verified: true,
          purchaseDate: true,
          helpful: true,
          unhelpful: true,
          responseText: true,
          responseAt: true,
          createdAt: true,
        },
      }),
      prisma.review.count({ where })
    ]);

    // Calculate average rating (only approved reviews)
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

    // Count verified purchases
    const verifiedCount = await prisma.review.count({
      where: { ...where, verified: true }
    });

    return NextResponse.json({
      reviews,
      total,
      verifiedCount,
      page,
      totalPages: Math.ceil(total / limit),
      averageRating: avgRating._avg.rating || 0,
      ratingDistribution: distribution.reduce((acc, item) => {
        acc[item.rating] = item._count;
        return acc;
      }, {} as Record<number, number>)
    }, {
      headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120' },
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
    const session = await getSession();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json(
        { error: 'Must be logged in to review' },
        { status: 401 }
      );
    }

    // Check if user is banned from posting reviews
    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        displayName: true,
        username: true,
        reviewBanned: true,
        reviewBannedUntil: true,
        reviewBannedReason: true,
      }
    });

    if (dbUser?.reviewBanned) {
      // Check if ban has expired
      if (dbUser.reviewBannedUntil && new Date() > dbUser.reviewBannedUntil) {
        // Auto-unban expired bans
        await prisma.user.update({
          where: { id: userId },
          data: {
            reviewBanned: false,
            reviewBannedAt: null,
            reviewBannedReason: null,
            reviewBannedUntil: null,
            reviewBannedBy: null,
          }
        });
      } else {
        return NextResponse.json(
          {
            error: 'You are currently banned from posting reviews',
            reason: dbUser.reviewBannedReason,
            bannedUntil: dbUser.reviewBannedUntil
          },
          { status: 403 }
        );
      }
    }

    const body = await request.json();
    const { gameId, merchId, rating, title, comment } = body;

    // Validate required fields
    if (!rating || !title || !comment) {
      return NextResponse.json(
        { error: 'Rating, title, and comment are required' },
        { status: 400 }
      );
    }

    // Validate rating
    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      );
    }

    // Validate title and comment length
    if (title.length < 5 || title.length > 100) {
      return NextResponse.json(
        { error: 'Title must be between 5 and 100 characters' },
        { status: 400 }
      );
    }

    if (comment.length < 20 || comment.length > 2000) {
      return NextResponse.json(
        { error: 'Review must be between 20 and 2000 characters' },
        { status: 400 }
      );
    }

    const productId = gameId ? parseInt(gameId) : parseInt(merchId);
    const productType = gameId ? 'game' : 'merch';

    // Check if user already reviewed this product
    const existingReview = await prisma.review.findFirst({
      where: {
        userId,
        ...(gameId ? { gameId: productId } : { merchId: productId })
      }
    });

    if (existingReview) {
      return NextResponse.json(
        { error: 'You have already reviewed this product' },
        { status: 400 }
      );
    }

    // Check if user purchased this product for verification
    const userEmail = dbUser?.email;
    let verificationData: {
      verified: boolean;
      orderId?: string;
      orderItemId?: number;
      purchaseDate?: Date;
    } = { verified: false };

    if (userEmail) {
      const purchaseRecord = await prisma.orderItem.findFirst({
        where: {
          order: {
            customerEmail: userEmail,
            status: { in: ['processing', 'shipped', 'delivered', 'completed'] }
          },
          ...(gameId ? { gameId: productId } : { merchId: productId })
        },
        include: {
          order: true
        }
      });

      if (purchaseRecord) {
        verificationData = {
          verified: true,
          orderId: purchaseRecord.orderId,
          orderItemId: purchaseRecord.id,
          purchaseDate: purchaseRecord.order.createdAt,
        };
      }
    }

    // Create display name from user info
    const displayName = dbUser?.displayName || dbUser?.username || 'Chaos Agent';

    const review = await prisma.review.create({
      data: {
        userId,
        userName: displayName,
        userEmail,
        rating,
        title: title.trim(),
        comment: comment.trim(),
        verified: verificationData.verified,
        orderId: verificationData.orderId,
        orderItemId: verificationData.orderItemId,
        purchaseDate: verificationData.purchaseDate,
        verifiedAt: verificationData.verified ? new Date() : null,
        status: 'approved', // Auto-approve for now
        ...(gameId ? { gameId: productId } : { merchId: productId })
      }
    });

    // Track the review activity
    await prisma.userActivity.create({
      data: {
        userId,
        action: 'review',
        targetType: productType,
        targetId: productId,
        metadata: JSON.stringify({ rating, verified: verificationData.verified })
      }
    });

    return NextResponse.json({
      success: true,
      review,
      verified: verificationData.verified,
      message: verificationData.verified
        ? 'Thanks for your review! Your purchase has been verified.'
        : 'Thanks for your review!'
    });
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
    const session = await getSession();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json(
        { error: 'Must be logged in to vote' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { reviewId, vote } = body;

    if (!['helpful', 'unhelpful'].includes(vote)) {
      return NextResponse.json(
        { error: 'Invalid vote type' },
        { status: 400 }
      );
    }

    const parsedReviewId = parseInt(reviewId);

    // Check if review exists
    const existingReview = await prisma.review.findUnique({
      where: { id: parsedReviewId }
    });

    if (!existingReview) {
      return NextResponse.json(
        { error: 'Review not found' },
        { status: 404 }
      );
    }

    // Don't allow voting on your own review
    if (existingReview.userId === userId) {
      return NextResponse.json(
        { error: 'You cannot vote on your own review' },
        { status: 400 }
      );
    }

    // Check if user already voted on this review
    const existingVote = await prisma.reviewVote.findUnique({
      where: {
        reviewId_userId: {
          reviewId: parsedReviewId,
          userId
        }
      }
    });

    if (existingVote) {
      // If same vote, remove it (toggle off)
      if (existingVote.vote === vote) {
        await prisma.$transaction([
          prisma.reviewVote.delete({
            where: { id: existingVote.id }
          }),
          prisma.review.update({
            where: { id: parsedReviewId },
            data: {
              [vote]: { decrement: 1 }
            }
          })
        ]);

        const updatedReview = await prisma.review.findUnique({
          where: { id: parsedReviewId },
          select: { id: true, helpful: true, unhelpful: true }
        });

        return NextResponse.json({
          success: true,
          action: 'removed',
          review: updatedReview
        });
      } else {
        // Different vote - change the vote
        const oldVote = existingVote.vote;
        await prisma.$transaction([
          prisma.reviewVote.update({
            where: { id: existingVote.id },
            data: { vote }
          }),
          prisma.review.update({
            where: { id: parsedReviewId },
            data: {
              [oldVote]: { decrement: 1 },
              [vote]: { increment: 1 }
            }
          })
        ]);

        const updatedReview = await prisma.review.findUnique({
          where: { id: parsedReviewId },
          select: { id: true, helpful: true, unhelpful: true }
        });

        return NextResponse.json({
          success: true,
          action: 'changed',
          review: updatedReview
        });
      }
    }

    // New vote
    await prisma.$transaction([
      prisma.reviewVote.create({
        data: {
          reviewId: parsedReviewId,
          userId,
          vote
        }
      }),
      prisma.review.update({
        where: { id: parsedReviewId },
        data: {
          [vote]: { increment: 1 }
        }
      })
    ]);

    const updatedReview = await prisma.review.findUnique({
      where: { id: parsedReviewId },
      select: { id: true, helpful: true, unhelpful: true }
    });

    return NextResponse.json({
      success: true,
      action: 'added',
      review: updatedReview
    });
  } catch (error) {
    console.error('Error voting on review:', error);
    return NextResponse.json(
      { error: 'Failed to vote on review' },
      { status: 500 }
    );
  }
}