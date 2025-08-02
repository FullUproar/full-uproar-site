import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const boardSlug = searchParams.get('board');
    const threadSlug = searchParams.get('thread');

    if (!boardSlug || !threadSlug) {
      return NextResponse.json({ error: 'Board and thread slugs are required' }, { status: 400 });
    }

    // Find the board
    const board = await prisma.messageBoard.findUnique({
      where: { slug: boardSlug }
    });

    if (!board) {
      return NextResponse.json({ error: 'Board not found' }, { status: 404 });
    }

    // Find the thread
    const thread = await prisma.messageThread.findFirst({
      where: {
        boardId: board.id,
        slug: threadSlug
      },
      include: {
        board: {
          select: {
            name: true,
            slug: true
          }
        }
      }
    });

    if (!thread) {
      return NextResponse.json({ error: 'Thread not found' }, { status: 404 });
    }

    // Get author info
    const author = await prisma.user.findUnique({
      where: { id: thread.authorId }
    });

    return NextResponse.json({
      ...thread,
      authorName: author?.displayName || author?.username || 'Anonymous'
    });
  } catch (error) {
    console.error('Error fetching thread:', error);
    return NextResponse.json({ error: 'Failed to fetch thread' }, { status: 500 });
  }
}