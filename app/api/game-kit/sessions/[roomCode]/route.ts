import { NextRequest, NextResponse } from 'next/server';
import { auth as getSession } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';
import { normalizeRoomCode, isValidRoomCode } from '@/lib/game-kit/room-codes';

/**
 * GET /api/game-kit/sessions/[roomCode]
 * Get session info by room code
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
      select: {
        id: true,
        roomCode: true,
        templateSlug: true,
        hostNickname: true,
        status: true,
        playerCount: true,
        spectatorCount: true,
        maxPlayers: true,
        isPrivate: true,
        allowSpectators: true,
        createdAt: true,
        startedAt: true,
        gameDefinition: {
          select: {
            id: true,
            name: true,
            description: true,
            coverImageUrl: true,
            minPlayers: true,
            maxPlayers: true,
          },
        },
        players: {
          select: {
            id: true,
            nickname: true,
            avatarEmoji: true,
            isHost: true,
            isSpectator: true,
            isReady: true,
            isConnected: true,
            score: true,
            isProxy: true,
            proxyManagedBy: true,
          },
          orderBy: { turnOrder: 'asc' },
        },
      },
    });

    if (!session) {
      return NextResponse.json(
        { error: 'Room not found', code: 'ROOM_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Check if room is still active
    if (session.status === 'COMPLETED' || session.status === 'ABANDONED') {
      return NextResponse.json(
        { error: 'This game has ended', code: 'GAME_ENDED' },
        { status: 410 }
      );
    }

    // Check if room is full
    const isFull = session.playerCount >= session.maxPlayers;

    return NextResponse.json({
      session: {
        ...session,
        isFull,
        canJoin: !isFull && session.status === 'WAITING',
        canSpectate: session.allowSpectators,
        requiresPassword: session.isPrivate,
      },
    });
  } catch (error) {
    console.error('Error getting session:', error);
    return NextResponse.json(
      { error: 'Failed to get session' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/game-kit/sessions/[roomCode]
 * Join a session
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

    const { nickname, avatarEmoji, isSpectator = false, password } = body;

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

    // Get session
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

    // Check password for private rooms
    if (session.isPrivate && session.password !== password) {
      return NextResponse.json(
        { error: 'Incorrect password' },
        { status: 403 }
      );
    }

    // Check if room is full (for non-spectators)
    if (!isSpectator && session.playerCount >= session.maxPlayers) {
      return NextResponse.json(
        { error: 'Room is full' },
        { status: 409 }
      );
    }

    // Check if game already started (can only spectate)
    if (!isSpectator && session.status !== 'WAITING') {
      return NextResponse.json(
        { error: 'Game already in progress. You can only join as a spectator.' },
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

    // Create player record
    const player = await prisma.sessionPlayer.create({
      data: {
        sessionId: session.id,
        clerkId: userId,
        nickname: nickname.trim(),
        avatarEmoji: avatarEmoji || '🎮',
        isSpectator,
        turnOrder: isSpectator ? null : session.playerCount,
      },
    });

    // Update session counts
    await prisma.gameSession.update({
      where: { id: session.id },
      data: {
        playerCount: isSpectator ? undefined : { increment: 1 },
        spectatorCount: isSpectator ? { increment: 1 } : undefined,
        lastActivityAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      player: {
        id: player.id,
        nickname: player.nickname,
        avatarEmoji: player.avatarEmoji,
        isSpectator: player.isSpectator,
      },
      session: {
        id: session.id,
        roomCode: session.roomCode,
        status: session.status,
      },
    });
  } catch (error) {
    console.error('Error joining session:', error);
    return NextResponse.json(
      { error: 'Failed to join session' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/game-kit/sessions/[roomCode]
 * End a session (host only)
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

    const session = await prisma.gameSession.findUnique({
      where: { roomCode },
    });

    if (!session) {
      return NextResponse.json(
        { error: 'Room not found' },
        { status: 404 }
      );
    }

    // Only host can end the session
    if (session.hostId !== userId) {
      return NextResponse.json(
        { error: 'Only the host can end the game' },
        { status: 403 }
      );
    }

    // Update session status
    await prisma.gameSession.update({
      where: { id: session.id },
      data: {
        status: 'ABANDONED',
        endedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Session ended',
    });
  } catch (error) {
    console.error('Error ending session:', error);
    return NextResponse.json(
      { error: 'Failed to end session' },
      { status: 500 }
    );
  }
}
