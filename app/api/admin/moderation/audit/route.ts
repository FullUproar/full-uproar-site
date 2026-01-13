import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    // Check moderator permission
    await requirePermission('admin', 'read');

    const { searchParams } = new URL(req.url);
    const targetUserId = searchParams.get('targetUserId');
    const moderatorId = searchParams.get('moderatorId');
    const actionType = searchParams.get('actionType');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (targetUserId) {
      where.targetUserId = targetUserId;
    }

    if (moderatorId) {
      where.moderatorId = moderatorId;
    }

    if (actionType) {
      where.actionType = actionType;
    }

    // Get actions with pagination
    const [actions, total] = await Promise.all([
      prisma.moderationAction.findMany({
        where,
        include: {
          moderator: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
              role: true
            }
          },
          targetUser: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
              isBanned: true,
              isMuted: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: limit
      }),
      prisma.moderationAction.count({ where })
    ]);

    return NextResponse.json({
      actions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching audit log:', error);
    return NextResponse.json(
      { error: 'Failed to fetch audit log' },
      { status: 500 }
    );
  }
}
