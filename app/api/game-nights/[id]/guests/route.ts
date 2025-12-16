import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

// GET /api/game-nights/[id]/guests - List guests
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const guests = await prisma.gameNightGuest.findMany({
      where: { gameNightId: id },
      include: {
        user: {
          select: { displayName: true, username: true, avatarUrl: true }
        }
      },
      orderBy: [
        { isCoHost: 'desc' },
        { status: 'asc' },
        { createdAt: 'asc' }
      ]
    });

    return NextResponse.json(guests);
  } catch (error) {
    console.error('Error fetching guests:', error);
    return NextResponse.json({ error: 'Failed to fetch guests' }, { status: 500 });
  }
}

// POST /api/game-nights/[id]/guests - Add a guest (by host)
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

    // Verify ownership or co-host status
    const gameNight = await prisma.gameNight.findUnique({
      where: { id },
      include: {
        guests: { where: { userId: user.id, isCoHost: true } },
        _count: { select: { guests: true } }
      }
    });

    if (!gameNight) {
      return NextResponse.json({ error: 'Game night not found' }, { status: 404 });
    }

    const isHost = gameNight.hostId === user.id;
    const isCoHost = gameNight.guests.length > 0;

    if (!isHost && !isCoHost) {
      return NextResponse.json({ error: 'Only host or co-hosts can add guests' }, { status: 403 });
    }

    // Check max guests
    if (gameNight.maxGuests && gameNight._count.guests >= gameNight.maxGuests) {
      return NextResponse.json({ error: 'Maximum guests reached' }, { status: 400 });
    }

    const body = await request.json();
    const { userId, guestName, guestEmail, guestPhone, isCoHost: makeCoHost } = body;

    // Must have either userId or guestName/guestEmail
    if (!userId && !guestName && !guestEmail) {
      return NextResponse.json({ error: 'Must provide userId, guestName, or guestEmail' }, { status: 400 });
    }

    // Check for duplicate
    if (userId) {
      const existing = await prisma.gameNightGuest.findUnique({
        where: { gameNightId_userId: { gameNightId: id, userId } }
      });
      if (existing) {
        return NextResponse.json({ error: 'User is already invited' }, { status: 400 });
      }
    }

    if (guestEmail) {
      const existing = await prisma.gameNightGuest.findUnique({
        where: { gameNightId_guestEmail: { gameNightId: id, guestEmail } }
      });
      if (existing) {
        return NextResponse.json({ error: 'This email is already invited' }, { status: 400 });
      }
    }

    const guest = await prisma.gameNightGuest.create({
      data: {
        gameNightId: id,
        userId: userId || null,
        guestName: guestName || null,
        guestEmail: guestEmail || null,
        guestPhone: guestPhone || null,
        isCoHost: makeCoHost || false,
        status: 'PENDING',
      },
      include: {
        user: {
          select: { displayName: true, username: true, avatarUrl: true }
        }
      }
    });

    return NextResponse.json(guest, { status: 201 });
  } catch (error) {
    console.error('Error adding guest:', error);
    return NextResponse.json({ error: 'Failed to add guest' }, { status: 500 });
  }
}
