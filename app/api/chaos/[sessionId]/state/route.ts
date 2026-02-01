import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface RouteParams {
  params: Promise<{ sessionId: string }>;
}

// POST /api/chaos/[sessionId]/state - Persist chaos session state from PartyKit
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { sessionId } = await params;

    // Verify request is from PartyKit (simple auth via header)
    const authHeader = request.headers.get('x-partykit-secret');
    const expectedSecret = process.env.PARTYKIT_SECRET || 'development-secret';

    if (authHeader !== expectedSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Get current session to check if status is changing to ENDED
    const currentSession = await prisma.chaosSession.findUnique({
      where: { id: sessionId },
      include: {
        participants: {
          where: { isHost: true },
          include: { user: true },
        },
      },
    });

    const wasNotEnded = currentSession && currentSession.status !== 'ENDED';
    const isNowEnded = body.status === 'ENDED';

    // Update session status and settings
    await prisma.chaosSession.update({
      where: { id: sessionId },
      data: {
        status: body.status,
        intensity: body.intensity,
        scoringMode: body.scoringMode,
        eventFrequencyMinutes: body.eventFrequencyMinutes,
        lastEventAt: body.lastEventAt ? new Date(body.lastEventAt) : null,
        startedAt: body.startedAt ? new Date(body.startedAt) : null,
        updatedAt: new Date(),
      },
    });

    // If session just ended, increment host's chaosSessionsHosted count
    if (wasNotEnded && isNowEnded && currentSession?.participants[0]?.userId) {
      const hostUserId = currentSession.participants[0].userId;
      await prisma.user.update({
        where: { id: hostUserId },
        data: {
          chaosSessionsHosted: { increment: 1 },
        },
      });
    }

    // Update participant points
    if (body.participants) {
      for (const [, p] of Object.entries(body.participants) as [string, any][]) {
        if (p.participantId) {
          await prisma.chaosParticipant.update({
            where: { id: p.participantId },
            data: {
              chaosPoints: p.chaosPoints,
              isConnected: p.isConnected,
            },
          }).catch(() => {
            // Participant might not exist in DB yet (just connected)
          });
        }
      }
    }

    // Persist bets
    if (body.bets) {
      for (const bet of Object.values(body.bets) as any[]) {
        // Upsert bet - only if we have a valid bettor ID
        if (bet.creatorParticipantId || bet.bettorId) {
          await prisma.chaosBet.upsert({
            where: { id: bet.id },
            create: {
              id: bet.id,
              sessionId,
              bettorId: bet.creatorParticipantId || bet.bettorId,
              betType: bet.betType || 'CUSTOM',
              description: bet.description,
              pointsWagered: bet.wagerAmount || bet.pointsWagered || 10,
              multiplier: bet.odds || 2.0,
              status: bet.status,
            },
            update: {
              status: bet.status,
            },
          }).catch(() => {
            // Bet might already exist or creator might be temporary
          });
        }
      }
    }

    // Persist current event to history if completed
    if (body.completedEvent) {
      await prisma.chaosEvent.create({
        data: {
          id: body.completedEvent.id,
          sessionId,
          templateId: body.completedEvent.type || 'CUSTOM', // Use type as templateId
          eventType: (body.completedEvent.type?.toUpperCase() || 'CHALLENGE') as any,
          title: body.completedEvent.title,
          description: body.completedEvent.description || '',
          targetType: 'ALL',
          status: body.completedEvent.status === 'COMPLETED' ? 'COMPLETED' : 'SKIPPED',
          triggeredAt: body.completedEvent.startedAt ? new Date(body.completedEvent.startedAt) : new Date(),
          completedAt: new Date(),
        },
      }).catch(() => {
        // Event might already exist
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error persisting chaos state:', error);
    return NextResponse.json({ error: 'Failed to persist state' }, { status: 500 });
  }
}

// GET /api/chaos/[sessionId]/state - Load persisted state for PartyKit room
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { sessionId } = await params;

    const session = await prisma.chaosSession.findUnique({
      where: { id: sessionId },
      include: {
        gameNight: {
          select: { title: true }
        },
        participants: true,
        objectives: true,
        events: {
          orderBy: { triggeredAt: 'desc' },
          take: 10,
        },
        bets: true,
      },
    });

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Convert to PartyKit state format
    const state = {
      roomCode: session.roomCode,
      sessionId: session.id,
      gameNightTitle: session.gameNight.title,
      status: session.status,
      intensity: session.intensity,
      eventFrequencyMinutes: session.eventFrequencyMinutes,
      lastEventAt: session.lastEventAt?.getTime(),
      startedAt: session.startedAt?.getTime(),
      createdAt: session.createdAt.getTime(),
      participants: session.participants.reduce((acc, p) => {
        acc[p.id] = {
          id: p.id,
          participantId: p.id,
          displayName: p.displayName,
          isHost: p.isHost,
          isConnected: false, // Will be updated when they reconnect
          chaosPoints: p.chaosPoints,
          setupComplete: true,
          userId: p.userId,
          guestId: p.guestId,
        };
        return acc;
      }, {} as Record<string, any>),
      objectives: session.objectives.reduce((acc, o) => {
        acc[o.id] = {
          id: o.id,
          title: o.title,
          description: o.description,
          chaosPointsReward: o.chaosPoints,
          status: o.status,
          assignedTo: o.participantId,
        };
        return acc;
      }, {} as Record<string, any>),
      eventHistory: session.events.map(e => ({
        id: e.id,
        type: e.eventType,
        title: e.title,
        description: e.description,
        status: e.status,
        startedAt: e.triggeredAt?.getTime(),
      })),
      bets: session.bets.reduce((acc, b) => {
        acc[b.id] = {
          id: b.id,
          creatorId: b.bettorId,
          betType: b.betType,
          description: b.description,
          wagerAmount: b.pointsWagered,
          odds: b.multiplier,
          status: b.status,
          participants: [],
        };
        return acc;
      }, {} as Record<string, any>),
    };

    return NextResponse.json(state);
  } catch (error) {
    console.error('Error loading chaos state:', error);
    return NextResponse.json({ error: 'Failed to load state' }, { status: 500 });
  }
}
