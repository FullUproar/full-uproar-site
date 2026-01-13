import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    // Check if user has moderator or admin role
    await requirePermission('admin', 'read');

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || 'PENDING';
    const priority = searchParams.get('priority');
    const contentType = searchParams.get('contentType');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (status && status !== 'ALL') {
      where.status = status;
    }

    if (priority) {
      where.priority = priority;
    }

    if (contentType) {
      where.contentType = contentType;
    }

    // Get reports with pagination
    const [reports, total] = await Promise.all([
      prisma.report.findMany({
        where,
        include: {
          reporter: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
              trustLevel: true
            }
          },
          targetUser: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
              flagCount: true,
              trustLevel: true,
              isBanned: true,
              isMuted: true
            }
          },
          reviewer: {
            select: {
              id: true,
              username: true,
              displayName: true
            }
          }
        },
        orderBy: [
          { priority: 'desc' },
          { createdAt: 'desc' }
        ],
        skip,
        take: limit
      }),
      prisma.report.count({ where })
    ]);

    return NextResponse.json({
      reports,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching moderation queue:', error);
    return NextResponse.json(
      { error: 'Failed to fetch moderation queue' },
      { status: 500 }
    );
  }
}
