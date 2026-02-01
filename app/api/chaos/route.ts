import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { MembershipTier, UserRole, GameNightStatus, ChaosScoringMode } from '@prisma/client';
import { isModeUnlocked, getUnlockedModes, getModeInfo } from '@/lib/chaos/mode-unlocking';

// Generate a 6-character room code
function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude confusing chars
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Check if user can create chaos sessions (same as game nights)
function canCreateChaos(user: { membershipTier: MembershipTier; role: UserRole }): boolean {
  const adminRoles: UserRole[] = [UserRole.GOD, UserRole.SUPER_ADMIN, UserRole.ADMIN];
  if (adminRoles.includes(user.role)) {
    return true;
  }

  const paidTiers: MembershipTier[] = [
    MembershipTier.AFTERROAR_PLUS,
    MembershipTier.VIP,
    MembershipTier.CREATOR,
    MembershipTier.BETA_TESTER,
  ];

  return paidTiers.includes(user.membershipTier);
}

// POST /api/chaos - Create a chaos session for a game night
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Check if user can create chaos sessions
    if (!canCreateChaos(user)) {
      return NextResponse.json(
        { error: 'Chaos Agent requires Afterroar+ subscription' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { gameNightId, intensity = 'MEDIUM', eventFrequencyMinutes = 15, scoringMode = 'PARTY' } = body;

    if (!gameNightId) {
      return NextResponse.json({ error: 'gameNightId is required' }, { status: 400 });
    }

    // Get user's session count for mode unlocking
    const sessionsHosted = user.chaosSessionsHosted || 0;
    const unlockedModes = getUnlockedModes(sessionsHosted);

    // Validate the requested scoring mode is unlocked
    const requestedMode = scoringMode as 'PARTY' | 'PRIVATE_BINGO' | 'COMPETITIVE';
    if (!isModeUnlocked(requestedMode, sessionsHosted)) {
      const modeInfo = getModeInfo(sessionsHosted).find(m => m.id === requestedMode);
      return NextResponse.json({
        error: `${modeInfo?.label || requestedMode} mode is locked. Host ${modeInfo?.sessionsRequired || 'more'} session(s) to unlock.`,
        unlockedModes,
        sessionsHosted,
      }, { status: 403 });
    }

    // Verify the game night exists and user is the host
    const gameNight = await prisma.gameNight.findUnique({
      where: { id: gameNightId },
      include: {
        chaosSession: true,
        guests: {
          where: { status: 'IN' },
          include: {
            user: { select: { id: true, displayName: true, username: true } }
          }
        }
      }
    });

    if (!gameNight) {
      return NextResponse.json({ error: 'Game night not found' }, { status: 404 });
    }

    if (gameNight.hostId !== user.id) {
      return NextResponse.json({ error: 'Only the host can activate Chaos Agent' }, { status: 403 });
    }

    // Check if chaos session already exists
    if (gameNight.chaosSession) {
      return NextResponse.json({
        session: gameNight.chaosSession,
        message: 'Chaos session already exists',
      });
    }

    // Game night should be in progress for chaos
    if (gameNight.status !== GameNightStatus.IN_PROGRESS) {
      return NextResponse.json(
        { error: 'Game night must be in progress to activate Chaos Agent' },
        { status: 400 }
      );
    }

    // Generate unique room code
    let roomCode = generateRoomCode();
    let attempts = 0;
    while (attempts < 10) {
      const existing = await prisma.chaosSession.findUnique({ where: { roomCode } });
      if (!existing) break;
      roomCode = generateRoomCode();
      attempts++;
    }

    // Create the chaos session with selected scoring mode
    const chaosSession = await prisma.chaosSession.create({
      data: {
        gameNightId,
        roomCode,
        intensity: intensity as any,
        eventFrequencyMinutes,
        scoringMode: requestedMode as ChaosScoringMode,
        status: 'SETUP',
      },
    });

    // Create the host as a participant
    const hostParticipant = await prisma.chaosParticipant.create({
      data: {
        sessionId: chaosSession.id,
        userId: user.id,
        displayName: user.displayName || user.username || 'Host',
        isHost: true,
        chaosPoints: 100,
      },
    });

    return NextResponse.json({
      session: {
        ...chaosSession,
        participants: [hostParticipant],
      },
      roomCode,
      joinUrl: `/chaos/join/${roomCode}`,
    });
  } catch (error) {
    console.error('Error creating chaos session:', error);
    return NextResponse.json({ error: 'Failed to create chaos session' }, { status: 500 });
  }
}

// GET /api/chaos - List user's chaos sessions (for debugging/admin)
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Get sessions where user is a participant
    const sessions = await prisma.chaosSession.findMany({
      where: {
        participants: {
          some: { userId: user.id }
        }
      },
      include: {
        gameNight: {
          select: { title: true, date: true, status: true }
        },
        participants: {
          select: { displayName: true, chaosPoints: true, isHost: true }
        },
        _count: {
          select: { objectives: true, events: true, bets: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    return NextResponse.json({ sessions });
  } catch (error) {
    console.error('Error listing chaos sessions:', error);
    return NextResponse.json({ error: 'Failed to list sessions' }, { status: 500 });
  }
}
