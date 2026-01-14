import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { currentUser } from '@clerk/nextjs/server';

// GET /api/rituals/[id] - Get ritual details
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const ritual = await prisma.ritual.findUnique({
      where: { id },
      include: {
        creator: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true
          }
        },
        regulars: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatarUrl: true
              }
            }
          }
        },
        gameNights: {
          where: {
            date: {
              gte: new Date()
            }
          },
          orderBy: {
            date: 'asc'
          },
          take: 5,
          include: {
            guests: {
              include: {
                user: {
                  select: {
                    id: true,
                    username: true,
                    displayName: true
                  }
                }
              }
            }
          }
        },
        _count: {
          select: {
            gameNights: true
          }
        }
      }
    });

    if (!ritual) {
      return NextResponse.json({ error: 'Ritual not found' }, { status: 404 });
    }

    // Check if user has access (creator or regular member)
    const hasAccess = ritual.creatorId === user.id ||
                     ritual.regulars.some(r => r.userId === user.id);

    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ ritual });

  } catch (error) {
    console.error('Error fetching ritual:', error);
    return NextResponse.json(
      { error: 'Failed to fetch ritual' },
      { status: 500 }
    );
  }
}

// PATCH /api/rituals/[id] - Update ritual
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const ritual = await prisma.ritual.findUnique({
      where: { id: id }
    });

    if (!ritual) {
      return NextResponse.json({ error: 'Ritual not found' }, { status: 404 });
    }

    // Only creator can update
    if (ritual.creatorId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const {
      name,
      description,
      recurrenceType,
      dayOfWeek,
      dayOfMonth,
      weekOfMonth,
      frequency,
      startDate,
      endDate,
      startTime,
      duration,
      timezone,
      isCampaign,
      campaignName,
      maxPlayers,
      autoCreateDays,
      isActive,
      imageUrl
    } = body;

    const updatedRitual = await prisma.ritual.update({
      where: { id: id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(recurrenceType !== undefined && { recurrenceType }),
        ...(dayOfWeek !== undefined && { dayOfWeek }),
        ...(dayOfMonth !== undefined && { dayOfMonth }),
        ...(weekOfMonth !== undefined && { weekOfMonth }),
        ...(frequency !== undefined && { frequency }),
        ...(startDate !== undefined && { startDate: new Date(startDate) }),
        ...(endDate !== undefined && { endDate: endDate ? new Date(endDate) : null }),
        ...(startTime !== undefined && { startTime }),
        ...(duration !== undefined && { duration }),
        ...(timezone !== undefined && { timezone }),
        ...(isCampaign !== undefined && { isCampaign }),
        ...(campaignName !== undefined && { campaignName }),
        ...(maxPlayers !== undefined && { maxPlayers }),
        ...(autoCreateDays !== undefined && { autoCreateDays }),
        ...(isActive !== undefined && { isActive }),
        ...(imageUrl !== undefined && { imageUrl })
      },
      include: {
        creator: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true
          }
        },
        regulars: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatarUrl: true
              }
            }
          }
        }
      }
    });

    return NextResponse.json({ ritual: updatedRitual });

  } catch (error) {
    console.error('Error updating ritual:', error);
    return NextResponse.json(
      { error: 'Failed to update ritual' },
      { status: 500 }
    );
  }
}

// DELETE /api/rituals/[id] - Delete ritual
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const ritual = await prisma.ritual.findUnique({
      where: { id: id }
    });

    if (!ritual) {
      return NextResponse.json({ error: 'Ritual not found' }, { status: 404 });
    }

    // Only creator can delete
    if (ritual.creatorId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await prisma.ritual.delete({
      where: { id: id }
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error deleting ritual:', error);
    return NextResponse.json(
      { error: 'Failed to delete ritual' },
      { status: 500 }
    );
  }
}
