import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { sendGameNightInvite } from '@/lib/email';

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
    const { userId, guestName, guestEmail, guestPhone, isCoHost: makeCoHost, sendEmail, personalMessage } = body;

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
        inviteMethod: sendEmail && guestEmail ? 'email' : 'link',
        inviteSentAt: sendEmail && guestEmail ? new Date() : null,
      },
      include: {
        user: {
          select: { displayName: true, username: true, avatarUrl: true }
        }
      }
    });

    // Send email invitation if requested
    let emailSent = false;
    if (sendEmail && guestEmail) {
      const host = await prisma.user.findUnique({
        where: { id: user.id },
        select: { displayName: true, username: true }
      });

      const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        });
      };

      emailSent = await sendGameNightInvite({
        guestName: guestName || 'Friend',
        guestEmail: guestEmail,
        hostName: host?.displayName || host?.username || 'Your friend',
        gameNightTitle: gameNight.title,
        gameNightDate: formatDate(gameNight.date),
        gameNightTime: gameNight.startTime,
        gameNightLocation: gameNight.location,
        gameNightVibe: gameNight.vibe,
        inviteToken: guest.inviteToken,
        personalMessage: personalMessage,
      });
    }

    return NextResponse.json({ ...guest, emailSent }, { status: 201 });
  } catch (error) {
    console.error('Error adding guest:', error);
    return NextResponse.json({ error: 'Failed to add guest' }, { status: 500 });
  }
}

// PATCH /api/game-nights/[id]/guests - Update guest or resend invite
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const { guestId, action, bringing, personalMessage } = body;

    if (!guestId) {
      return NextResponse.json({ error: 'Guest ID required' }, { status: 400 });
    }

    // Get the game night and verify permissions
    const gameNight = await prisma.gameNight.findUnique({
      where: { id },
      include: {
        guests: true,
        host: { select: { displayName: true, username: true } }
      }
    });

    if (!gameNight) {
      return NextResponse.json({ error: 'Game night not found' }, { status: 404 });
    }

    const isHost = gameNight.hostId === user.id;
    const isCoHost = gameNight.guests.some(g => g.userId === user.id && g.isCoHost);
    const isSelf = gameNight.guests.some(g => g.id === guestId && g.userId === user.id);

    // Handle resend invite (hosts/co-hosts only)
    if (action === 'resend_invite') {
      if (!isHost && !isCoHost) {
        return NextResponse.json({ error: 'Only hosts can resend invites' }, { status: 403 });
      }

      const guest = await prisma.gameNightGuest.findUnique({
        where: { id: guestId }
      });

      if (!guest || !guest.guestEmail) {
        return NextResponse.json({ error: 'Guest has no email address' }, { status: 400 });
      }

      const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        });
      };

      const emailSent = await sendGameNightInvite({
        guestName: guest.guestName || 'Friend',
        guestEmail: guest.guestEmail,
        hostName: gameNight.host.displayName || gameNight.host.username || 'Your friend',
        gameNightTitle: gameNight.title,
        gameNightDate: formatDate(gameNight.date),
        gameNightTime: gameNight.startTime,
        gameNightLocation: gameNight.location,
        gameNightVibe: gameNight.vibe,
        inviteToken: guest.inviteToken,
        personalMessage: personalMessage,
      });

      if (emailSent) {
        await prisma.gameNightGuest.update({
          where: { id: guestId },
          data: { inviteSentAt: new Date(), inviteMethod: 'email' }
        });
      }

      return NextResponse.json({ success: true, emailSent });
    }

    // Handle updating "bringing" (self only or hosts)
    if (bringing !== undefined) {
      if (!isHost && !isCoHost && !isSelf) {
        return NextResponse.json({ error: 'Cannot update this guest' }, { status: 403 });
      }

      const updated = await prisma.gameNightGuest.update({
        where: { id: guestId },
        data: { bringing },
        include: {
          user: {
            select: { displayName: true, username: true, avatarUrl: true }
          }
        }
      });

      return NextResponse.json(updated);
    }

    return NextResponse.json({ error: 'No valid action specified' }, { status: 400 });
  } catch (error) {
    console.error('Error updating guest:', error);
    return NextResponse.json({ error: 'Failed to update guest' }, { status: 500 });
  }
}
