import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth as getSession } from '@/lib/auth-config';

// GET /api/rituals - List user's rituals
export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const includeInactive = searchParams.get('includeInactive') === 'true';

    const where: any = {
      OR: [
        { creatorId: userId },
        { regulars: { some: { userId: userId } } }
      ]
    };

    if (!includeInactive) {
      where.isActive = true;
    }

    const rituals = await prisma.ritual.findMany({
      where,
      include: {
        creator: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true
          }
        },
        regulars: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatarUrl: true
              }
            }
          }
        },
        _count: {
          select: {
            gameNights: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({ rituals });

  } catch (error) {
    console.error('Error fetching rituals:', error);
    return NextResponse.json(
      { error: 'Failed to fetch rituals' },
      { status: 500 }
    );
  }
}

// POST /api/rituals - Create a ritual
export async function POST(req: NextRequest) {
  try {
    const postSession = await getSession();
    const postUserId = postSession?.user?.id;
    if (!postUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // TODO: Check if user has Afterroar subscription
    // For now, allow all authenticated users

    const body = await req.json();
    const {
      name,
      description,
      recurrenceType,
      dayOfWeek,
      dayOfMonth,
      weekOfMonth,
      frequency,
      startDate,
      endDate,
      startTime,
      duration,
      timezone,
      isCampaign,
      campaignName,
      maxPlayers,
      autoCreateDays,
      imageUrl
    } = body;

    // Validation
    if (!name || !recurrenceType || !startDate || !startTime) {
      return NextResponse.json(
        { error: 'Missing required fields: name, recurrenceType, startDate, startTime' },
        { status: 400 }
      );
    }

    // Create the ritual
    const ritual = await prisma.ritual.create({
      data: {
        creatorId: postUserId,
        name,
        description: description || null,
        imageUrl: imageUrl || null,
        recurrenceType,
        dayOfWeek: dayOfWeek !== undefined ? dayOfWeek : null,
        dayOfMonth: dayOfMonth !== undefined ? dayOfMonth : null,
        weekOfMonth: weekOfMonth !== undefined ? weekOfMonth : null,
        frequency: frequency || 1,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        startTime,
        duration: duration || null,
        timezone: timezone || 'America/Los_Angeles',
        isCampaign: isCampaign || false,
        campaignName: campaignName || null,
        maxPlayers: maxPlayers || null,
        autoCreateDays: autoCreateDays || 14,
        isActive: true
      },
      include: {
        creator: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true
          }
        }
      }
    });

    // Add creator as a regular (host role)
    await prisma.ritualRegular.create({
      data: {
        ritualId: ritual.id,
        userId: postUserId,
        role: 'host'
      }
    });

    return NextResponse.json({ ritual }, { status: 201 });

  } catch (error) {
    console.error('Error creating ritual:', error);
    return NextResponse.json(
      { error: 'Failed to create ritual' },
      { status: 500 }
    );
  }
}
