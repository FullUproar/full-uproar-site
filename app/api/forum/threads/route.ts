import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';
import { UserSecurityService } from '@/lib/services/user-security';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check user permissions
    const securityCheck = await UserSecurityService.checkUserAction(userId, 'create_thread');
    if (!securityCheck.allowed) {
      return NextResponse.json({ 
        error: securityCheck.reason || 'You cannot create threads at this time',
        requiresVerification: securityCheck.requiresVerification 
      }, { status: 403 });
    }

    const data = await request.json();
    const { boardSlug, title, content } = data;

    if (!boardSlug || !title || !content) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Find the board
    const board = await prisma.messageBoard.findUnique({
      where: { slug: boardSlug }
    });

    if (!board) {
      return NextResponse.json({ error: 'Board not found' }, { status: 404 });
    }

    // Generate a unique slug for the thread
    const baseSlug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 100);
    
    let slug = baseSlug;
    let counter = 1;

    // Check if slug exists and generate a unique one
    while (await prisma.messageThread.findFirst({ where: { boardId: board.id, slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    // Create the thread and first post in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const thread = await tx.messageThread.create({
        data: {
          boardId: board.id,
          title: title.substring(0, 255),
          slug,
          authorId: userId,
        }
      });

      const post = await tx.messagePost.create({
        data: {
          threadId: thread.id,
          authorId: userId,
          content: content,
        }
      });

      return { thread, post };
    });

    return NextResponse.json({ 
      ...result.thread,
      boardSlug: board.slug 
    });
  } catch (error) {
    console.error('Error creating thread:', error);
    return NextResponse.json({ error: 'Failed to create thread' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const boardSlug = searchParams.get('board');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const sortBy = searchParams.get('sortBy') || 'lastPostAt';
    const order = searchParams.get('order') || 'desc';

    const where: any = {};
    
    if (boardSlug) {
      const board = await prisma.messageBoard.findUnique({
        where: { slug: boardSlug }
      });
      
      if (!board) {
        return NextResponse.json({ error: 'Board not found' }, { status: 404 });
      }
      
      where.boardId = board.id;
    }

    const threads = await prisma.messageThread.findMany({
      where,
      orderBy: { [sortBy]: order },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        board: {
          select: {
            name: true,
            slug: true
          }
        },
        _count: {
          select: {
            posts: true
          }
        }
      }
    });

    // Get author information
    const threadsWithAuthors = await Promise.all(threads.map(async (thread) => {
      const author = await prisma.user.findUnique({
        where: { id: thread.authorId }
      });

      const lastPost = await prisma.messagePost.findFirst({
        where: { threadId: thread.id },
        orderBy: { createdAt: 'desc' },
        include: {
          author: {
            select: {
              displayName: true,
              username: true
            }
          }
        }
      });

      return {
        ...thread,
        authorName: author?.displayName || author?.username || 'Anonymous',
        postCount: thread._count.posts,
        lastPostAuthor: lastPost?.author.displayName || lastPost?.author.username || 'Anonymous',
        lastPostAt: lastPost?.createdAt || thread.createdAt
      };
    }));

    // Get total count for pagination
    const totalCount = await prisma.messageThread.count({ where });

    return NextResponse.json({
      threads: threadsWithAuthors,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching threads:', error);
    return NextResponse.json({ error: 'Failed to fetch threads' }, { status: 500 });
  }
}