import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/game-nights/join/[token] - Get game night info via invite token (public)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    const guest = await prisma.gameNightGuest.findUnique({
      where: { inviteToken: token },
      include: {
        gameNight: {
          include: {
            host: {
              select: { displayName: true, username: true, avatarUrl: true }
            },
            guests: {
              where: { status: 'IN' },
              select: {
                guestName: true,
                user: {
                  select: { displayName: true, username: true, avatarUrl: true }
                }
              }
            },
            games: {
              include: {
                game: {
                  select: { title: true, imageUrl: true, players: true }
                }
              },
              orderBy: { playOrder: 'asc' }
            },
            _count: {
              select: { guests: true }
            }
          }
        }
      }
    });

    if (!guest) {
      return NextResponse.json({ error: 'Invalid or expired invite link' }, { status: 404 });
    }

    const { gameNight } = guest;

    // Return limited info for the invite view
    return NextResponse.json({
      gameNight: {
        id: gameNight.id,
        title: gameNight.title,
        description: gameNight.description,
        date: gameNight.date,
        startTime: gameNight.startTime,
        location: gameNight.location,
        vibe: gameNight.vibe,
        theme: gameNight.theme,
        host: gameNight.host,
        confirmedGuests: gameNight.guests.map(g => ({
          name: g.user?.displayName || g.user?.username || g.guestName,
          avatarUrl: g.user?.avatarUrl,
        })),
        gamesPlanned: gameNight.games.map(g => ({
          name: g.game?.title || g.customGameName,
          imageUrl: g.game?.imageUrl,
        })),
        totalInvited: gameNight._count.guests,
      },
      guest: {
        id: guest.id,
        status: guest.status,
        guestName: guest.guestName,
        respondedAt: guest.respondedAt,
      },
      inviteToken: token,
    });
  } catch (error) {
    console.error('Error fetching invite:', error);
    return NextResponse.json({ error: 'Failed to fetch invite' }, { status: 500 });
  }
}

// POST /api/game-nights/join/[token] - RSVP via invite token (public)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const body = await request.json();
    const { status, guestName, bringing } = body;

    if (!status || !['IN', 'MAYBE', 'OUT'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const guest = await prisma.gameNightGuest.findUnique({
      where: { inviteToken: token }
    });

    if (!guest) {
      return NextResponse.json({ error: 'Invalid or expired invite link' }, { status: 404 });
    }

    // Update the guest record
    const updated = await prisma.gameNightGuest.update({
      where: { id: guest.id },
      data: {
        status,
        respondedAt: new Date(),
        ...(guestName && !guest.userId && { guestName }), // Only update name if not a registered user
        ...(bringing !== undefined && { bringing }),
      },
      include: {
        gameNight: {
          select: { title: true, date: true, startTime: true, location: true }
        }
      }
    });

    // Generate response message based on status
    const messages = {
      IN: "You're in! See you there! 🎲",
      MAYBE: "Got it! We hope you can make it! 🤞",
      OUT: "No worries! Maybe next time! 👋",
    };

    return NextResponse.json({
      success: true,
      message: messages[status as keyof typeof messages],
      guest: updated,
    });
  } catch (error) {
    console.error('Error updating RSVP:', error);
    return NextResponse.json({ error: 'Failed to update RSVP' }, { status: 500 });
  }
}
