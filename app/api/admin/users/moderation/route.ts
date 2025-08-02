import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    await requirePermission('users', 'read');

    const searchParams = request.nextUrl.searchParams;
    const filter = searchParams.get('filter') || 'all';

    let where = {};

    switch (filter) {
      case 'banned':
        where = { isBanned: true };
        break;
      case 'muted':
        where = { isMuted: true };
        break;
      case 'flagged':
        where = { flagCount: { gte: 5 } };
        break;
    }

    const users = await prisma.user.findMany({
      where,
      orderBy: [
        { flagCount: 'desc' },
        { createdAt: 'desc' }
      ],
      take: 100
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error('Error fetching moderation users:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch users' 
    }, { status: 500 });
  }
}