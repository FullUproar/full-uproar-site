import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

// GET /api/game-nights/[id]/games - Get the game lineup with vote counts
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();

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
        },
        votes: true, // Include all votes
      },
      orderBy: { playOrder: 'asc' }
    });

    // Calculate vote counts and user's vote for each game
    const gamesWithVotes = games.map((game) => {
      const upvotes = game.votes.filter(v => v.vote > 0).length;
      const downvotes = game.votes.filter(v => v.vote < 0).length;
      const totalVotes = upvotes - downvotes;

      // Find current user's vote if they exist
      let userVote = 0;
      if (user) {
        const existingVote = game.votes.find(v => v.userId === user.id);
        if (existingVote) {
          userVote = existingVote.vote;
        }
      }

      // Don't expose all vote details in response
      const { votes, ...gameData } = game;

      return {
        ...gameData,
        voteCount: totalVotes,
        upvotes,
        downvotes,
        userVote,
        voterCount: game.votes.length,
      };
    });

    return NextResponse.json(gamesWithVotes);
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

// PATCH /api/game-nights/[id]/games - Vote on a game
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

    const body = await request.json();
    const { gameNightGameId, vote, guestId } = body;

    if (!gameNightGameId || vote === undefined) {
      return NextResponse.json({ error: 'gameNightGameId and vote are required' }, { status: 400 });
    }

    // Validate vote value
    if (![1, 0, -1].includes(vote)) {
      return NextResponse.json({ error: 'Vote must be 1, 0, or -1' }, { status: 400 });
    }

    // Verify game night exists and user has access
    const gameNight = await prisma.gameNight.findUnique({
      where: { id },
      include: {
        guests: true
      }
    });

    if (!gameNight) {
      return NextResponse.json({ error: 'Game night not found' }, { status: 404 });
    }

    const isHost = gameNight.hostId === user.id;
    const isGuest = gameNight.guests.some(g => g.userId === user.id);

    if (!isHost && !isGuest) {
      return NextResponse.json({ error: 'You are not part of this game night' }, { status: 403 });
    }

    // Use either guestId or userId for the vote
    const voteUserId = isHost && !guestId ? user.id : null;
    const voteGuestId = guestId || (isGuest ? gameNight.guests.find(g => g.userId === user.id)?.id : null);

    if (!voteUserId && !voteGuestId) {
      return NextResponse.json({ error: 'Could not determine voter identity' }, { status: 400 });
    }

    // Upsert the vote
    if (vote === 0) {
      // Remove vote if exists
      if (voteUserId) {
        await prisma.gameNightGameVote.deleteMany({
          where: { gameNightGameId, userId: voteUserId }
        });
      } else if (voteGuestId) {
        await prisma.gameNightGameVote.deleteMany({
          where: { gameNightGameId, guestId: voteGuestId }
        });
      }
    } else {
      // Create or update vote
      if (voteUserId) {
        await prisma.gameNightGameVote.upsert({
          where: {
            gameNightGameId_userId: { gameNightGameId, userId: voteUserId }
          },
          create: {
            gameNightGameId,
            userId: voteUserId,
            vote,
          },
          update: {
            vote,
          },
        });
      } else if (voteGuestId) {
        await prisma.gameNightGameVote.upsert({
          where: {
            gameNightGameId_guestId: { gameNightGameId, guestId: voteGuestId }
          },
          create: {
            gameNightGameId,
            guestId: voteGuestId,
            vote,
          },
          update: {
            vote,
          },
        });
      }
    }

    // Get updated vote counts
    const updatedGame = await prisma.gameNightGame.findUnique({
      where: { id: gameNightGameId },
      include: { votes: true }
    });

    if (!updatedGame) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }

    const upvotes = updatedGame.votes.filter(v => v.vote > 0).length;
    const downvotes = updatedGame.votes.filter(v => v.vote < 0).length;

    return NextResponse.json({
      success: true,
      voteCount: upvotes - downvotes,
      upvotes,
      downvotes,
      userVote: vote,
      voterCount: updatedGame.votes.length,
    });
  } catch (error) {
    console.error('Error voting on game:', error);
    return NextResponse.json({ error: 'Failed to vote' }, { status: 500 });
  }
}
