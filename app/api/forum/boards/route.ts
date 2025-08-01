import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const boards = await prisma.messageBoard.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: {
          select: { threads: true }
        }
      }
    });

    // Get post counts and last posts for each board
    const boardsWithStats = await Promise.all(boards.map(async (board) => {
      const threads = await prisma.messageThread.findMany({
        where: { boardId: board.id },
        include: {
          _count: { select: { posts: true } }
        }
      });

      const postCount = threads.reduce((sum, thread) => sum + thread._count.posts, 0);

      // Get last post
      const lastPost = await prisma.messagePost.findFirst({
        where: {
          thread: { boardId: board.id }
        },
        orderBy: { createdAt: 'desc' },
        include: {
          thread: true,
          author: true
        }
      });

      return {
        ...board,
        threadCount: board._count.threads,
        postCount,
        lastPost: lastPost ? {
          threadTitle: lastPost.thread.title,
          threadSlug: lastPost.thread.slug,
          authorName: lastPost.author.displayName || lastPost.author.username || 'Anonymous',
          createdAt: new Date(lastPost.createdAt).toLocaleDateString()
        } : null
      };
    }));

    return NextResponse.json(boardsWithStats);
  } catch (error) {
    console.error('Error fetching boards:', error);
    return NextResponse.json({ error: 'Failed to fetch boards' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    const board = await prisma.messageBoard.create({
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description,
        icon: data.icon,
        sortOrder: data.sortOrder || 0,
        isPrivate: data.isPrivate || false
      }
    });

    return NextResponse.json(board);
  } catch (error) {
    console.error('Error creating board:', error);
    return NextResponse.json({ error: 'Failed to create board' }, { status: 500 });
  }
}