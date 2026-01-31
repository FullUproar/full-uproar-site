import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

interface RouteParams {
  params: Promise<{ sessionId: string }>;
}

// GET /api/chaos/[sessionId] - Get session state
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { sessionId } = await params;
    const user = await getCurrentUser();

    const session = await prisma.chaosSession.findUnique({
      where: { id: sessionId },
      include: {
        gameNight: {
          select: {
            id: true,
            title: true,
            date: true,
            status: true,
            hostId: true,
            host: {
              select: { displayName: true, username: true }
            }
          }
        },
        participants: {
          select: {
            id: true,
            displayName: true,
            isHost: true,
            isConnected: true,
            chaosPoints: true,
            objectivesCompleted: true,
            betsWon: true,
            userId: true,
          },
          orderBy: { chaosPoints: 'desc' }
        },
        events: {
          where: { status: { in: ['ACTIVE', 'COMPLETED'] } },
          orderBy: { triggeredAt: 'desc' },
          take: 10
        },
        bets: {
          where: { status: { in: ['OPEN', 'LOCKED'] } },
          include: {
            bettor: { select: { displayName: true } },
            target: { select: { displayName: true } }
          }
        },
        _count: {
          select: {
            participants: true,
            objectives: true,
            events: true,
            bets: true,
            miniGames: true
          }
        }
      }
    });

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Get user's participant record if they're in the session
    let userParticipant = null;
    if (user) {
      userParticipant = session.participants.find(p => p.userId === user.id);
    }

    // Get user's objectives (private, only visible to them)
    let objectives: any[] = [];
    if (userParticipant) {
      objectives = await prisma.chaosObjective.findMany({
        where: {
          sessionId,
          participantId: userParticipant.id,
        },
        orderBy: { createdAt: 'asc' }
      });
    }

    // Get active event details
    const activeEvent = await prisma.chaosEvent.findFirst({
      where: { sessionId, status: 'ACTIVE' }
    });

    return NextResponse.json({
      session: {
        id: session.id,
        roomCode: session.roomCode,
        status: session.status,
        intensity: session.intensity,
        eventFrequencyMinutes: session.eventFrequencyMinutes,
        startedAt: session.startedAt,
        createdAt: session.createdAt,
      },
      gameNight: session.gameNight,
      participants: session.participants,
      activeEvent,
      recentEvents: session.events,
      openBets: session.bets,
      counts: session._count,
      // Private data for the current user
      userParticipant,
      objectives,
    });
  } catch (error) {
    console.error('Error fetching chaos session:', error);
    return NextResponse.json({ error: 'Failed to fetch session' }, { status: 500 });
  }
}

// PATCH /api/chaos/[sessionId] - Update session (host only)
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { sessionId } = await params;
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const { status, intensity, eventFrequencyMinutes } = body;

    // Verify user is the host
    const session = await prisma.chaosSession.findUnique({
      where: { id: sessionId },
      include: {
        participants: {
          where: { userId: user.id, isHost: true }
        }
      }
    });

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    if (session.participants.length === 0) {
      return NextResponse.json({ error: 'Only the host can update the session' }, { status: 403 });
    }

    // Build update data
    const updateData: any = {};

    if (status) {
      updateData.status = status;
      if (status === 'ACTIVE' && !session.startedAt) {
        updateData.startedAt = new Date();
      }
      if (status === 'ENDED') {
        updateData.endedAt = new Date();
      }
    }

    if (intensity) {
      updateData.intensity = intensity;
    }

    if (eventFrequencyMinutes !== undefined) {
      updateData.eventFrequencyMinutes = eventFrequencyMinutes;
    }

    const updated = await prisma.chaosSession.update({
      where: { id: sessionId },
      data: updateData,
    });

    return NextResponse.json({ session: updated });
  } catch (error) {
    console.error('Error updating chaos session:', error);
    return NextResponse.json({ error: 'Failed to update session' }, { status: 500 });
  }
}

// DELETE /api/chaos/[sessionId] - End and delete session (host only)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { sessionId } = await params;
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Verify user is the host
    const session = await prisma.chaosSession.findUnique({
      where: { id: sessionId },
      include: {
        gameNight: { select: { hostId: true } }
      }
    });

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    if (session.gameNight.hostId !== user.id) {
      return NextResponse.json({ error: 'Only the host can end the session' }, { status: 403 });
    }

    // Mark as ended rather than deleting (for stats)
    const updated = await prisma.chaosSession.update({
      where: { id: sessionId },
      data: {
        status: 'ENDED',
        endedAt: new Date(),
      }
    });

    return NextResponse.json({ message: 'Session ended', session: updated });
  } catch (error) {
    console.error('Error ending chaos session:', error);
    return NextResponse.json({ error: 'Failed to end session' }, { status: 500 });
  }
}
