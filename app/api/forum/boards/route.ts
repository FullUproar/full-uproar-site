import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';

// Check if user can access a board based on access level
async function canAccessBoard(
  accessLevel: string,
  userId: string | null,
  membershipTier: string | null
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
      // Private access requires explicit invite - handled separately
      return false;
    default:
      return true;
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get current user for access control
    const { userId: clerkId } = await auth();
    let dbUser = null;
    if (clerkId) {
      dbUser = await prisma.user.findUnique({
        where: { clerkId },
        select: { id: true, membershipTier: true },
      });
    }

    // Fetch categories with their boards
    const categories = await prisma.boardCategory.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      include: {
        boards: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
          include: {
            _count: { select: { threads: true } },
            invites: dbUser ? {
              where: { userId: dbUser.id },
            } : false,
          },
        },
      },
    });

    // Build response with stats for each board
    const categoriesWithStats = await Promise.all(
      categories.map(async (category) => {
        const boardsWithStats = await Promise.all(
          category.boards.map(async (board) => {
            // Check access
            let userCanAccess = await canAccessBoard(
              board.accessLevel,
              dbUser?.id || null,
              dbUser?.membershipTier || null
            );

            // Check private board invite
            if (board.accessLevel === 'PRIVATE' && dbUser) {
              const hasInvite = (board as any).invites?.length > 0;
              userCanAccess = hasInvite;
            }

            // Get post count
            const threads = await prisma.messageThread.findMany({
              where: { boardId: board.id },
              include: { _count: { select: { posts: true } } },
            });
            const postCount = threads.reduce((sum, thread) => sum + thread._count.posts, 0);

            // Get last post
            const lastPost = await prisma.messagePost.findFirst({
              where: { thread: { boardId: board.id } },
              orderBy: { createdAt: 'desc' },
              include: {
                thread: true,
                author: { select: { displayName: true, username: true } },
              },
            });

            return {
              id: board.id,
              slug: board.slug,
              name: board.name,
              description: board.description,
              icon: board.icon,
              accessLevel: board.accessLevel,
              threadCount: board._count.threads,
              postCount,
              lastPost: lastPost
                ? {
                    threadTitle: lastPost.thread.title,
                    threadSlug: lastPost.thread.slug,
                    authorName: lastPost.author.displayName || lastPost.author.username || 'Anonymous',
                    createdAt: lastPost.createdAt.toISOString(),
                  }
                : null,
              userCanAccess,
            };
          })
        );

        return {
          id: category.id,
          slug: category.slug,
          name: category.name,
          description: category.description,
          icon: category.icon,
          boards: boardsWithStats,
        };
      })
    );

    return NextResponse.json({ categories: categoriesWithStats });
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