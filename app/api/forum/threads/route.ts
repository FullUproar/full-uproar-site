import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth as getSession } from '@/lib/auth-config';
import { UserSecurityService } from '@/lib/services/user-security';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    const userId = session?.user?.id;
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check user permissions
    const securityCheck = await UserSecurityService.canPerformAction(userId, 'create_thread');
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

// Check if user can access a board based on access level
async function canAccessBoard(
  accessLevel: string,
  userId: string | null,
  membershipTier: string | null,
  boardId: number
): Promise<boolean> {
  switch (accessLevel) {
    case 'PUBLIC':
      return true;
    case 'MEMBERS_ONLY':
      return !!userId;
    case 'SUBSCRIBERS_ONLY':
      const premiumTiers = ['AFTERROAR_PLUS', 'VIP', 'CREATOR'];
      return !!userId && !!membershipTier && premiumTiers.includes(membershipTier);
    case 'PRIVATE':
      // Check for explicit invite
      if (!userId) return false;
      const invite = await prisma.boardInvite.findFirst({
        where: { boardId, userId }
      });
      return !!invite;
    default:
      return true;
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

    // Get current user for access control
    const sessionData = await getSession();
    const currentUserId = sessionData?.user?.id;
    let dbUser = null;
    if (currentUserId) {
      dbUser = await prisma.user.findUnique({
        where: { id: currentUserId },
        select: { id: true, membershipTier: true },
      });
    }

    const where: any = {};
    let board = null;

    if (boardSlug) {
      board = await prisma.messageBoard.findUnique({
        where: { slug: boardSlug }
      });

      if (!board) {
        return NextResponse.json({ error: 'Board not found' }, { status: 404 });
      }

      // Check access control
      const hasAccess = await canAccessBoard(
        board.accessLevel,
        dbUser?.id || null,
        dbUser?.membershipTier || null,
        board.id
      );

      if (!hasAccess) {
        // Return board info but no threads - teaser mode
        const threadCount = await prisma.messageThread.count({ where: { boardId: board.id } });
        return NextResponse.json({
          threads: [],
          accessDenied: true,
          accessLevel: board.accessLevel,
          boardName: board.name,
          threadCount, // Show how many threads exist (FOMO)
          message: board.accessLevel === 'MEMBERS_ONLY'
            ? 'Sign up for a free account to view this board'
            : board.accessLevel === 'SUBSCRIBERS_ONLY'
            ? 'This board is exclusive to Afterroar+ members'
            : 'This is a private board',
          pagination: { page: 1, limit, totalCount: threadCount, totalPages: 0 }
        });
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