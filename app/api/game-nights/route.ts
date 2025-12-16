import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

// GET /api/game-nights - List user's game nights
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const includeAttending = searchParams.get('attending') === 'true';

    // Get game nights where user is host
    const hostedNights = await prisma.gameNight.findMany({
      where: {
        hostId: user.id,
        ...(status ? { status: status as any } : {}),
      },
      include: {
        guests: {
          include: {
            user: {
              select: { displayName: true, username: true, avatarUrl: true }
            }
          }
        },
        games: {
          include: {
            game: { select: { title: true, imageUrl: true, players: true } }
          },
          orderBy: { playOrder: 'asc' }
        },
        _count: {
          select: { guests: true, games: true, moments: true }
        }
      },
      orderBy: { date: 'asc' }
    });

    // Optionally include game nights user is attending
    let attendingNights: any[] = [];
    if (includeAttending) {
      attendingNights = await prisma.gameNight.findMany({
        where: {
          guests: {
            some: {
              userId: user.id,
              status: { in: ['IN', 'MAYBE'] }
            }
          },
          hostId: { not: user.id }
        },
        include: {
          host: {
            select: { displayName: true, username: true, avatarUrl: true }
          },
          guests: {
            where: { userId: user.id },
            select: { status: true, bringing: true }
          },
          _count: {
            select: { guests: true, games: true }
          }
        },
        orderBy: { date: 'asc' }
      });
    }

    return NextResponse.json({
      hosted: hostedNights,
      attending: attendingNights,
    });
  } catch (error) {
    console.error('Error fetching game nights:', error);
    return NextResponse.json({ error: 'Failed to fetch game nights' }, { status: 500 });
  }
}

// POST /api/game-nights - Create a new game night
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, date, startTime, duration, location, maxGuests, vibe, theme } = body;

    if (!date) {
      return NextResponse.json({ error: 'Date is required' }, { status: 400 });
    }

    const gameNight = await prisma.gameNight.create({
      data: {
        hostId: user.id,
        title: title || 'Game Night',
        description,
        date: new Date(date),
        startTime,
        duration: duration ? parseInt(duration) : null,
        location,
        maxGuests: maxGuests ? parseInt(maxGuests) : null,
        vibe: vibe || 'CHILL',
        theme,
        status: 'PLANNING',
      },
      include: {
        host: {
          select: { displayName: true, username: true, avatarUrl: true }
        },
        guests: true,
        games: true,
      }
    });

    return NextResponse.json(gameNight, { status: 201 });
  } catch (error) {
    console.error('Error creating game night:', error);
    return NextResponse.json({ error: 'Failed to create game night' }, { status: 500 });
  }
}
