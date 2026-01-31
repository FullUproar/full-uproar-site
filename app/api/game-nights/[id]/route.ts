import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

// GET /api/game-nights/[id] - Get a specific game night
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();

    const gameNight = await prisma.gameNight.findUnique({
      where: { id },
      include: {
        host: {
          select: { id: true, displayName: true, username: true, avatarUrl: true, email: true }
        },
        guests: {
          include: {
            user: {
              select: { id: true, displayName: true, username: true, avatarUrl: true }
            }
          },
          orderBy: { createdAt: 'asc' }
        },
        games: {
          include: {
            game: {
              select: { id: true, title: true, imageUrl: true, players: true, timeToPlay: true }
            }
          },
          orderBy: { playOrder: 'asc' }
        },
        moments: {
          orderBy: { createdAt: 'desc' },
          take: 50
        },
        recap: true,
        chaosSession: {
          select: { id: true, roomCode: true, status: true }
        },
      }
    });

    if (!gameNight) {
      return NextResponse.json({ error: 'Game night not found' }, { status: 404 });
    }

    // Check access - host, guest, or public recap
    const isHost = user?.id === gameNight.hostId;
    const isGuest = gameNight.guests.some(g => g.userId === user?.id);
    const isPublicRecap = gameNight.recap?.isPublic;

    if (!isHost && !isGuest && !isPublicRecap) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Calculate guest counts
    const guestCounts = {
      total: gameNight.guests.length,
      in: gameNight.guests.filter(g => g.status === 'IN').length,
      maybe: gameNight.guests.filter(g => g.status === 'MAYBE').length,
      out: gameNight.guests.filter(g => g.status === 'OUT').length,
      pending: gameNight.guests.filter(g => g.status === 'PENDING').length,
    };

    return NextResponse.json({
      ...gameNight,
      guestCounts,
      isHost,
      isGuest,
      userGuestRecord: isGuest ? gameNight.guests.find(g => g.userId === user?.id) : null,
    });
  } catch (error) {
    console.error('Error fetching game night:', error);
    return NextResponse.json({ error: 'Failed to fetch game night' }, { status: 500 });
  }
}

// PUT /api/game-nights/[id] - Update a game night
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Verify ownership
    const existingNight = await prisma.gameNight.findUnique({
      where: { id },
      select: { hostId: true }
    });

    if (!existingNight) {
      return NextResponse.json({ error: 'Game night not found' }, { status: 404 });
    }

    if (existingNight.hostId !== user.id) {
      return NextResponse.json({ error: 'Only the host can update this game night' }, { status: 403 });
    }

    const body = await request.json();
    const { title, description, date, startTime, duration, location, maxGuests, vibe, theme, status } = body;

    const gameNight = await prisma.gameNight.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(date !== undefined && { date: new Date(date) }),
        ...(startTime !== undefined && { startTime }),
        ...(duration !== undefined && { duration: duration ? parseInt(duration) : null }),
        ...(location !== undefined && { location }),
        ...(maxGuests !== undefined && { maxGuests: maxGuests ? parseInt(maxGuests) : null }),
        ...(vibe !== undefined && { vibe }),
        ...(theme !== undefined && { theme }),
        ...(status !== undefined && { status }),
        ...(status === 'COMPLETED' && { completedAt: new Date() }),
      },
      include: {
        guests: true,
        games: true,
      }
    });

    return NextResponse.json(gameNight);
  } catch (error) {
    console.error('Error updating game night:', error);
    return NextResponse.json({ error: 'Failed to update game night' }, { status: 500 });
  }
}

// PATCH /api/game-nights/[id] - Partial update (house rules, etc.)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Verify ownership
    const existingNight = await prisma.gameNight.findUnique({
      where: { id },
      select: { hostId: true }
    });

    if (!existingNight) {
      return NextResponse.json({ error: 'Game night not found' }, { status: 404 });
    }

    if (existingNight.hostId !== user.id) {
      return NextResponse.json({ error: 'Only the host can update this game night' }, { status: 403 });
    }

    const body = await request.json();
    const { houseRules } = body;

    const updateData: any = {};
    if (houseRules !== undefined) {
      updateData.houseRules = houseRules;
    }

    const gameNight = await prisma.gameNight.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(gameNight);
  } catch (error) {
    console.error('Error patching game night:', error);
    return NextResponse.json({ error: 'Failed to update game night' }, { status: 500 });
  }
}

// DELETE /api/game-nights/[id] - Delete a game night
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Verify ownership
    const existingNight = await prisma.gameNight.findUnique({
      where: { id },
      select: { hostId: true }
    });

    if (!existingNight) {
      return NextResponse.json({ error: 'Game night not found' }, { status: 404 });
    }

    if (existingNight.hostId !== user.id) {
      return NextResponse.json({ error: 'Only the host can delete this game night' }, { status: 403 });
    }

    await prisma.gameNight.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting game night:', error);
    return NextResponse.json({ error: 'Failed to delete game night' }, { status: 500 });
  }
}
