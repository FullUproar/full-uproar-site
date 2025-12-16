import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

// POST /api/game-nights/[id]/rsvp - Update RSVP status
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, bringing, inviteToken } = body;

    if (!status || !['IN', 'MAYBE', 'OUT'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status. Must be IN, MAYBE, or OUT' }, { status: 400 });
    }

    // Find the guest record - either by user ID or invite token
    const user = await getCurrentUser();
    let guest;

    if (user) {
      // Authenticated user - find by userId
      guest = await prisma.gameNightGuest.findFirst({
        where: {
          gameNightId: id,
          userId: user.id,
        }
      });

      // If no guest record exists, check if this is an open invite and create one
      if (!guest) {
        const gameNight = await prisma.gameNight.findUnique({
          where: { id },
          select: { hostId: true, maxGuests: true, _count: { select: { guests: true } } }
        });

        if (!gameNight) {
          return NextResponse.json({ error: 'Game night not found' }, { status: 404 });
        }

        // Don't allow host to RSVP to their own event
        if (gameNight.hostId === user.id) {
          return NextResponse.json({ error: 'Host cannot RSVP to their own event' }, { status: 400 });
        }

        // Check max guests
        if (gameNight.maxGuests && gameNight._count.guests >= gameNight.maxGuests) {
          return NextResponse.json({ error: 'This game night is full' }, { status: 400 });
        }

        // Create a new guest record
        guest = await prisma.gameNightGuest.create({
          data: {
            gameNightId: id,
            userId: user.id,
            status: status,
            respondedAt: new Date(),
            bringing: bringing || null,
          }
        });

        return NextResponse.json(guest);
      }
    } else if (inviteToken) {
      // Unauthenticated - find by invite token
      guest = await prisma.gameNightGuest.findUnique({
        where: { inviteToken }
      });

      if (!guest || guest.gameNightId !== id) {
        return NextResponse.json({ error: 'Invalid invite token' }, { status: 404 });
      }
    } else {
      return NextResponse.json({ error: 'Must be logged in or provide invite token' }, { status: 401 });
    }

    // Update the guest status
    const updatedGuest = await prisma.gameNightGuest.update({
      where: { id: guest.id },
      data: {
        status: status,
        respondedAt: new Date(),
        ...(bringing !== undefined && { bringing }),
      },
      include: {
        gameNight: {
          select: { title: true, date: true, startTime: true, location: true }
        },
        user: {
          select: { displayName: true, username: true }
        }
      }
    });

    return NextResponse.json(updatedGuest);
  } catch (error) {
    console.error('Error updating RSVP:', error);
    return NextResponse.json({ error: 'Failed to update RSVP' }, { status: 500 });
  }
}
