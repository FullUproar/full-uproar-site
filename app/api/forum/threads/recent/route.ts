import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const threads = await prisma.messageThread.findMany({
      where: {
        board: { isActive: true }
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        _count: { select: { posts: true } }
      }
    });

    const threadsWithAuthors = await Promise.all(threads.map(async (thread) => {
      const author = await prisma.user.findUnique({
        where: { id: thread.authorId }
      });

      return {
        ...thread,
        authorName: author?.displayName || author?.username || 'Anonymous',
        postCount: thread._count.posts
      };
    }));

    return NextResponse.json(threadsWithAuthors);
  } catch (error) {
    console.error('Error fetching recent threads:', error);
    return NextResponse.json({ error: 'Failed to fetch recent threads' }, { status: 500 });
  }
}