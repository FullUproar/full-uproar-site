import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

// GET /api/game-nights/[id]/games - Get the game lineup
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const games = await prisma.gameNightGame.findMany({
      where: { gameNightId: id },
      include: {
        game: {
          select: {
            id: true,
            title: true,
            imageUrl: true,
            players: true,
            timeToPlay: true,
            description: true,
          }
        }
      },
      orderBy: { playOrder: 'asc' }
    });

    return NextResponse.json(games);
  } catch (error) {
    console.error('Error fetching game lineup:', error);
    return NextResponse.json({ error: 'Failed to fetch game lineup' }, { status: 500 });
  }
}

// POST /api/game-nights/[id]/games - Add a game to the lineup
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Verify host or co-host
    const gameNight = await prisma.gameNight.findUnique({
      where: { id },
      include: {
        guests: { where: { userId: user.id, isCoHost: true } },
        games: { orderBy: { playOrder: 'desc' }, take: 1 }
      }
    });

    if (!gameNight) {
      return NextResponse.json({ error: 'Game night not found' }, { status: 404 });
    }

    const isHost = gameNight.hostId === user.id;
    const isCoHost = gameNight.guests.length > 0;

    if (!isHost && !isCoHost) {
      return NextResponse.json({ error: 'Only host or co-hosts can modify the lineup' }, { status: 403 });
    }

    const body = await request.json();
    const { gameId, customGameName, estimatedMinutes } = body;

    if (!gameId && !customGameName) {
      return NextResponse.json({ error: 'Must provide gameId or customGameName' }, { status: 400 });
    }

    // Get the next play order
    const nextOrder = gameNight.games.length > 0 ? gameNight.games[0].playOrder + 1 : 0;

    const gameNightGame = await prisma.gameNightGame.create({
      data: {
        gameNightId: id,
        gameId: gameId || null,
        customGameName: customGameName || null,
        playOrder: nextOrder,
        estimatedMinutes: estimatedMinutes ? parseInt(estimatedMinutes) : null,
        status: 'PLANNED',
      },
      include: {
        game: {
          select: {
            id: true,
            title: true,
            imageUrl: true,
            players: true,
            timeToPlay: true,
          }
        }
      }
    });

    return NextResponse.json(gameNightGame, { status: 201 });
  } catch (error) {
    console.error('Error adding game to lineup:', error);
    return NextResponse.json({ error: 'Failed to add game' }, { status: 500 });
  }
}

// PUT /api/game-nights/[id]/games - Reorder games or update game status
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

    const gameNight = await prisma.gameNight.findUnique({
      where: { id },
      include: { guests: { where: { userId: user.id, isCoHost: true } } }
    });

    if (!gameNight) {
      return NextResponse.json({ error: 'Game night not found' }, { status: 404 });
    }

    const isHost = gameNight.hostId === user.id;
    const isCoHost = gameNight.guests.length > 0;

    if (!isHost && !isCoHost) {
      return NextResponse.json({ error: 'Only host or co-hosts can modify the lineup' }, { status: 403 });
    }

    const body = await request.json();
    const { gameNightGameId, status, winnerId, winnerName, chaosLevel, notes, playOrder } = body;

    if (!gameNightGameId) {
      return NextResponse.json({ error: 'gameNightGameId is required' }, { status: 400 });
    }

    const updateData: any = {};

    if (status !== undefined) {
      updateData.status = status;
      if (status === 'PLAYING') updateData.startedAt = new Date();
      if (status === 'COMPLETED') updateData.completedAt = new Date();
    }
    if (winnerId !== undefined) updateData.winnerId = winnerId;
    if (winnerName !== undefined) updateData.winnerName = winnerName;
    if (chaosLevel !== undefined) updateData.chaosLevel = chaosLevel;
    if (notes !== undefined) updateData.notes = notes;
    if (playOrder !== undefined) updateData.playOrder = playOrder;

    const updated = await prisma.gameNightGame.update({
      where: { id: gameNightGameId },
      data: updateData,
      include: {
        game: {
          select: { title: true, imageUrl: true }
        }
      }
    });

    // If a winner was set, increment their games won count
    if (winnerId) {
      await prisma.gameNightGuest.update({
        where: { id: winnerId },
        data: { gamesWon: { increment: 1 } }
      });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating game:', error);
    return NextResponse.json({ error: 'Failed to update game' }, { status: 500 });
  }
}

// DELETE /api/game-nights/[id]/games?gameId=xxx - Remove a game from lineup
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

    const { searchParams } = new URL(request.url);
    const gameNightGameId = searchParams.get('gameId');

    if (!gameNightGameId) {
      return NextResponse.json({ error: 'gameId query parameter required' }, { status: 400 });
    }

    const gameNight = await prisma.gameNight.findUnique({
      where: { id },
      include: { guests: { where: { userId: user.id, isCoHost: true } } }
    });

    if (!gameNight) {
      return NextResponse.json({ error: 'Game night not found' }, { status: 404 });
    }

    const isHost = gameNight.hostId === user.id;
    const isCoHost = gameNight.guests.length > 0;

    if (!isHost && !isCoHost) {
      return NextResponse.json({ error: 'Only host or co-hosts can modify the lineup' }, { status: 403 });
    }

    await prisma.gameNightGame.delete({
      where: { id: gameNightGameId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing game:', error);
    return NextResponse.json({ error: 'Failed to remove game' }, { status: 500 });
  }
}
