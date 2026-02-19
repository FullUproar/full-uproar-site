import { NextRequest, NextResponse } from 'next/server';
import { auth as getSession } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';
import { normalizeRoomCode, isValidRoomCode } from '@/lib/game-kit/room-codes';

/**
 * POST /api/game-kit/sessions/[roomCode]/proxy
 * Add a proxy (IRL) player to the session
 * Host only
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ roomCode: string }> }
) {
  try {
    const postSession = await getSession();
    const userId = postSession?.user?.id;
    const { roomCode: rawCode } = await params;
    const roomCode = normalizeRoomCode(rawCode);
    const body = await request.json();

    const { nickname, avatarEmoji } = body;

    if (!isValidRoomCode(roomCode)) {
      return NextResponse.json(
        { error: 'Invalid room code format' },
        { status: 400 }
      );
    }

    if (!nickname || nickname.trim().length < 1) {
      return NextResponse.json(
        { error: 'Nickname is required' },
        { status: 400 }
      );
    }

    // Get session and verify host
    const session = await prisma.gameSession.findUnique({
      where: { roomCode },
      include: {
        players: true,
      },
    });

    if (!session) {
      return NextResponse.json(
        { error: 'Room not found' },
        { status: 404 }
      );
    }

    // Only host can add proxy players
    if (session.hostId !== userId) {
      return NextResponse.json(
        { error: 'Only the host can add IRL players' },
        { status: 403 }
      );
    }

    // Check if room is full
    if (session.playerCount >= session.maxPlayers) {
      return NextResponse.json(
        { error: 'Room is full' },
        { status: 409 }
      );
    }

    // Check for duplicate nickname
    const existingPlayer = session.players.find(
      p => p.nickname.toLowerCase() === nickname.trim().toLowerCase()
    );
    if (existingPlayer) {
      return NextResponse.json(
        { error: 'Nickname already taken' },
        { status: 409 }
      );
    }

    // Find the host's session player ID
    const hostPlayer = session.players.find(p => p.isHost);
    if (!hostPlayer) {
      return NextResponse.json(
        { error: 'Host player not found in session' },
        { status: 500 }
      );
    }

    // Create proxy player record
    const proxyPlayer = await prisma.sessionPlayer.create({
      data: {
        sessionId: session.id,
        clerkId: null, // Proxy players don't have accounts
        nickname: nickname.trim(),
        avatarEmoji: avatarEmoji || '🎴',
        isHost: false,
        isSpectator: false,
        isReady: true, // Proxy players are always "ready"
        isConnected: true, // They're "connected" via the host
        isProxy: true,
        proxyManagedBy: hostPlayer.id,
        turnOrder: session.playerCount,
      },
    });

    // Update session player count
    await prisma.gameSession.update({
      where: { id: session.id },
      data: {
        playerCount: { increment: 1 },
        lastActivityAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      player: {
        id: proxyPlayer.id,
        nickname: proxyPlayer.nickname,
        avatarEmoji: proxyPlayer.avatarEmoji,
        isProxy: true,
        proxyManagedBy: hostPlayer.id,
      },
    });
  } catch (error) {
    console.error('Error adding proxy player:', error);
    return NextResponse.json(
      { error: 'Failed to add proxy player' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/game-kit/sessions/[roomCode]/proxy
 * Remove a proxy (IRL) player from the session
 * Host only
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ roomCode: string }> }
) {
  try {
    const delSession = await getSession();
    const userId = delSession?.user?.id;
    const { roomCode: rawCode } = await params;
    const roomCode = normalizeRoomCode(rawCode);

    // Get playerId from query params
    const { searchParams } = new URL(request.url);
    const playerId = searchParams.get('playerId');

    if (!playerId) {
      return NextResponse.json(
        { error: 'playerId is required' },
        { status: 400 }
      );
    }

    if (!isValidRoomCode(roomCode)) {
      return NextResponse.json(
        { error: 'Invalid room code format' },
        { status: 400 }
      );
    }

    // Get session and verify host
    const session = await prisma.gameSession.findUnique({
      where: { roomCode },
      include: {
        players: true,
      },
    });

    if (!session) {
      return NextResponse.json(
        { error: 'Room not found' },
        { status: 404 }
      );
    }

    // Only host can remove proxy players
    if (session.hostId !== userId) {
      return NextResponse.json(
        { error: 'Only the host can remove IRL players' },
        { status: 403 }
      );
    }

    // Find the proxy player
    const proxyPlayer = session.players.find(p => p.id === playerId);
    if (!proxyPlayer) {
      return NextResponse.json(
        { error: 'Player not found' },
        { status: 404 }
      );
    }

    // Verify it's actually a proxy player
    if (!proxyPlayer.isProxy) {
      return NextResponse.json(
        { error: 'Can only remove proxy (IRL) players through this endpoint' },
        { status: 400 }
      );
    }

    // Delete the proxy player
    await prisma.sessionPlayer.delete({
      where: { id: playerId },
    });

    // Update session player count
    await prisma.gameSession.update({
      where: { id: session.id },
      data: {
        playerCount: { decrement: 1 },
        lastActivityAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Proxy player removed',
    });
  } catch (error) {
    console.error('Error removing proxy player:', error);
    return NextResponse.json(
      { error: 'Failed to remove proxy player' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/game-kit/sessions/[roomCode]/proxy
 * Get all proxy (IRL) players in the session
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ roomCode: string }> }
) {
  try {
    const { roomCode: rawCode } = await params;
    const roomCode = normalizeRoomCode(rawCode);

    if (!isValidRoomCode(roomCode)) {
      return NextResponse.json(
        { error: 'Invalid room code format' },
        { status: 400 }
      );
    }

    const session = await prisma.gameSession.findUnique({
      where: { roomCode },
      include: {
        players: {
          where: { isProxy: true },
          select: {
            id: true,
            nickname: true,
            avatarEmoji: true,
            isReady: true,
            score: true,
            proxyManagedBy: true,
          },
          orderBy: { turnOrder: 'asc' },
        },
      },
    });

    if (!session) {
      return NextResponse.json(
        { error: 'Room not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      proxyPlayers: session.players,
    });
  } catch (error) {
    console.error('Error getting proxy players:', error);
    return NextResponse.json(
      { error: 'Failed to get proxy players' },
      { status: 500 }
    );
  }
}
