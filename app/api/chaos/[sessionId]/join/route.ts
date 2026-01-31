import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

interface RouteParams {
  params: Promise<{ sessionId: string }>;
}

// POST /api/chaos/[sessionId]/join - Join a chaos session
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { sessionId } = await params;
    const user = await getCurrentUser();
    const body = await request.json();
    const { displayName, guestId } = body;

    // Get the session
    const session = await prisma.chaosSession.findUnique({
      where: { id: sessionId },
      include: {
        gameNight: {
          select: { id: true, title: true, hostId: true }
        },
        participants: true
      }
    });

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Check if session is accepting participants
    if (session.status === 'ENDED') {
      return NextResponse.json({ error: 'This chaos session has ended' }, { status: 400 });
    }

    // Determine display name
    let name = displayName;
    if (user) {
      name = name || user.displayName || user.username || 'Player';
    }
    if (!name) {
      return NextResponse.json({ error: 'Display name is required' }, { status: 400 });
    }

    // Check if user is already a participant
    let participant = null;
    if (user) {
      participant = session.participants.find(p => p.userId === user.id);
    } else if (guestId) {
      participant = session.participants.find(p => p.guestId === guestId);
    }

    if (participant) {
      // Already joined - just return the existing participant
      return NextResponse.json({
        participant,
        session: {
          id: session.id,
          roomCode: session.roomCode,
          status: session.status,
          gameNightTitle: session.gameNight.title,
        },
        partyKitRoom: `chaos-${session.roomCode}`,
        alreadyJoined: true,
      });
    }

    // Create new participant
    participant = await prisma.chaosParticipant.create({
      data: {
        sessionId,
        userId: user?.id || null,
        guestId: guestId || null,
        displayName: name,
        isHost: false,
        chaosPoints: 100, // Starting pool
      },
    });

    return NextResponse.json({
      participant,
      session: {
        id: session.id,
        roomCode: session.roomCode,
        status: session.status,
        gameNightTitle: session.gameNight.title,
      },
      partyKitRoom: `chaos-${session.roomCode}`,
      alreadyJoined: false,
    });
  } catch (error) {
    console.error('Error joining chaos session:', error);
    return NextResponse.json({ error: 'Failed to join session' }, { status: 500 });
  }
}
