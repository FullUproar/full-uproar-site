import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const threads = await prisma.messageThread.findMany({
      where: {
        board: { isActive: true }
      },
      orderBy: { viewCount: 'desc' },
      take: 5,
      include: {
        _count: { select: { posts: true } },
        board: { select: { slug: true, name: true } }
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
    console.error('Error fetching popular threads:', error);
    return NextResponse.json({ error: 'Failed to fetch popular threads' }, { status: 500 });
  }
}