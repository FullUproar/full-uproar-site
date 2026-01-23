import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { generateUniqueRoomCode, normalizeRoomCode, isValidRoomCode } from '@/lib/game-kit/room-codes';

// Environment variable for PartyKit host
const PARTYKIT_HOST = process.env.NEXT_PUBLIC_PARTYKIT_HOST || 'localhost:1999';

/**
 * POST /api/game-kit/sessions
 * Create a new game session (room)
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    const body = await request.json();

    const {
      gameDefinitionId,
      templateSlug,
      hostNickname,
      maxPlayers = 16,
      isPrivate = false,
      password,
      allowSpectators = true,
      turnTimeLimit,
    } = body;

    // Validate: must have either gameDefinitionId or templateSlug
    if (!gameDefinitionId && !templateSlug) {
      return NextResponse.json(
        { error: 'Either gameDefinitionId or templateSlug is required' },
        { status: 400 }
      );
    }

    // Validate host nickname
    if (!hostNickname || hostNickname.trim().length < 1) {
      return NextResponse.json(
        { error: 'Host nickname is required' },
        { status: 400 }
      );
    }

    // Generate unique room code
    const roomCode = await generateUniqueRoomCode(async (code) => {
      const existing = await prisma.gameSession.findUnique({
        where: { roomCode: code },
      });
      return !!existing;
    });

    // Get game config if using a custom game definition
    let gameConfig = null;
    if (gameDefinitionId) {
      const gameDef = await prisma.customGameDefinition.findUnique({
        where: { id: gameDefinitionId },
        include: {
          cardPacks: {
            include: { cards: true },
          },
        },
      });

      if (!gameDef) {
        return NextResponse.json(
          { error: 'Game definition not found' },
          { status: 404 }
        );
      }

      const baseConfig = gameDef.gameConfig as Record<string, unknown> ?? {};
      gameConfig = {
        ...baseConfig,
        cardPacks: gameDef.cardPacks,
      };
    }

    // Create session in database
    const session = await prisma.gameSession.create({
      data: {
        roomCode,
        gameDefinitionId,
        templateSlug,
        ...(gameConfig && { gameConfig }),
        hostId: userId,
        hostNickname: hostNickname.trim(),
        maxPlayers,
        isPrivate,
        password: isPrivate ? password : null,
        allowSpectators,
        turnTimeLimit,
        playerCount: 0,
      },
    });

    // Initialize PartyKit room with game config
    try {
      const partyResponse = await fetch(
        `https://${PARTYKIT_HOST}/party/${roomCode}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            gameConfig,
            templateSlug,
            settings: {
              maxPlayers,
              turnTimeLimit,
              allowSpectators,
              isPrivate,
            },
          }),
        }
      );

      if (!partyResponse.ok) {
        console.warn('Failed to initialize PartyKit room:', await partyResponse.text());
      }
    } catch (error) {
      // PartyKit might not be running in development
      console.warn('PartyKit initialization skipped:', error);
    }

    return NextResponse.json({
      success: true,
      session: {
        id: session.id,
        roomCode: session.roomCode,
        hostNickname: session.hostNickname,
        maxPlayers: session.maxPlayers,
        status: session.status,
        joinUrl: `/room/${session.roomCode}`,
        hostUrl: `/game-session/${session.roomCode}`,
      },
    });
  } catch (error) {
    console.error('Error creating session:', error);
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/game-kit/sessions
 * List active sessions (for discovery/lobby)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const templateSlug = searchParams.get('template');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Get public, active sessions
    const sessions = await prisma.gameSession.findMany({
      where: {
        isPrivate: false,
        status: { in: ['WAITING', 'IN_PROGRESS'] },
        ...(templateSlug && { templateSlug }),
      },
      select: {
        id: true,
        roomCode: true,
        templateSlug: true,
        hostNickname: true,
        playerCount: true,
        maxPlayers: true,
        status: true,
        createdAt: true,
        gameDefinition: {
          select: {
            name: true,
            coverImageUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return NextResponse.json({
      sessions: sessions.map(s => ({
        ...s,
        joinUrl: `/room/${s.roomCode}`,
      })),
    });
  } catch (error) {
    console.error('Error listing sessions:', error);
    return NextResponse.json(
      { error: 'Failed to list sessions' },
      { status: 500 }
    );
  }
}
