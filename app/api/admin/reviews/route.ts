import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin permission (basic check - you may want to enhance this)
    const user = await prisma.user.findFirst({
      where: { clerkId: userId },
      select: { role: true }
    });

    if (!user || !['ADMIN', 'MODERATOR', 'SUPPORT', 'GOD'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status') || 'all';
    const search = searchParams.get('search') || '';

    // Build where clause
    const where: Record<string, unknown> = {};

    if (status !== 'all') {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { comment: { contains: search, mode: 'insensitive' } },
        { userName: { contains: search, mode: 'insensitive' } },
        { userEmail: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Fetch reviews with related data
    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where,
        orderBy: [
          { status: 'asc' }, // pending first
          { createdAt: 'desc' }
        ],
        skip: (page - 1) * limit,
        take: limit,
        include: {
          game: {
            select: { title: true, slug: true }
          },
          merch: {
            select: { name: true, slug: true }
          }
        }
      }),
      prisma.review.count({ where })
    ]);

    // Get status counts
    const [pending, approved, rejected, flagged] = await Promise.all([
      prisma.review.count({ where: { status: 'pending' } }),
      prisma.review.count({ where: { status: 'approved' } }),
      prisma.review.count({ where: { status: 'rejected' } }),
      prisma.review.count({ where: { status: 'flagged' } }),
    ]);

    return NextResponse.json({
      reviews,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      stats: {
        pending,
        approved,
        rejected,
        flagged
      }
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reviews' },
      { status: 500 }
    );
  }
}
