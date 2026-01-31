import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface RouteParams {
  params: Promise<{ code: string }>;
}

// GET /api/chaos/lookup/[code] - Look up session by room code
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { code } = await params;

    const session = await prisma.chaosSession.findUnique({
      where: { roomCode: code.toUpperCase() },
      include: {
        gameNight: {
          select: { title: true }
        },
        participants: {
          where: { isHost: true },
          select: { displayName: true },
          take: 1,
        },
        _count: {
          select: { participants: true }
        }
      }
    });

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    if (session.status === 'ENDED') {
      return NextResponse.json({ error: 'This session has ended' }, { status: 410 });
    }

    return NextResponse.json({
      sessionId: session.id,
      gameNightTitle: session.gameNight.title,
      hostName: session.participants[0]?.displayName || 'Host',
      participantCount: session._count.participants,
      status: session.status,
    });
  } catch (error) {
    console.error('Error looking up chaos session:', error);
    return NextResponse.json({ error: 'Failed to look up session' }, { status: 500 });
  }
}
