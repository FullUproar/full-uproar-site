import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { MembershipTier, UserRole } from '@prisma/client';

// Helper to check if user can create game nights
function canCreateGameNight(user: { membershipTier: MembershipTier; role: UserRole }): boolean {
  // Admins can always create game nights
  const adminRoles: UserRole[] = [UserRole.GOD, UserRole.SUPER_ADMIN, UserRole.ADMIN];
  if (adminRoles.includes(user.role)) {
    return true;
  }

  // Subscribers with any paid tier can create game nights
  const paidTiers: MembershipTier[] = [
    MembershipTier.AFTERROAR_PLUS,
    MembershipTier.VIP,
    MembershipTier.CREATOR,
    MembershipTier.BETA_TESTER,
  ];

  return paidTiers.includes(user.membershipTier);
}

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

    // Check if user can create game nights
    const canCreate = canCreateGameNight(user);

    return NextResponse.json({
      hosted: hostedNights,
      attending: attendingNights,
      canCreateGameNight: canCreate,
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

    // Check if user has permission to create game nights (Afterroar+ or admin)
    if (!canCreateGameNight(user)) {
      return NextResponse.json(
        { error: 'Game night creation requires an Afterroar+ subscription', code: 'SUBSCRIPTION_REQUIRED' },
        { status: 403 }
      );
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
