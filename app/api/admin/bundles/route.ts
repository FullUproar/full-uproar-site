import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth/require-admin';

// GET - List all bundles
export async function GET(request: NextRequest) {
  try {
    const adminCheck = await requireAdmin();
    if (!adminCheck.authorized) return adminCheck.response;

    const bundles = await prisma.game.findMany({
      where: { isBundle: true },
      select: {
        id: true,
        title: true,
        slug: true,
        tagline: true,
        description: true,
        priceCents: true,
        imageUrl: true,
        featured: true,
        isNew: true,
        stock: true,
        bundleInfo: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(bundles);
  } catch (error) {
    console.error('Error fetching bundles:', error);
    return NextResponse.json({ error: 'Failed to fetch bundles' }, { status: 500 });
  }
}

// POST - Create a new bundle
export async function POST(request: NextRequest) {
  try {
    const adminCheck = await requireAdmin();
    if (!adminCheck.authorized) return adminCheck.response;

    const data = await request.json();

    // Validate required fields
    if (!data.title || !data.slug || !data.description) {
      return NextResponse.json(
        { error: 'Missing required fields: title, slug, description' },
        { status: 400 }
      );
    }

    // Validate bundleInfo (must have at least 2 games)
    if (!data.bundleInfo) {
      return NextResponse.json(
        { error: 'Bundle must include games (bundleInfo required)' },
        { status: 400 }
      );
    }

    try {
      const gameIds = JSON.parse(data.bundleInfo);
      if (!Array.isArray(gameIds) || gameIds.length < 2) {
        return NextResponse.json(
          { error: 'Bundle must include at least 2 games' },
          { status: 400 }
        );
      }

      // Verify all games exist
      const games = await prisma.game.findMany({
        where: { id: { in: gameIds }, isBundle: false },
        select: { id: true }
      });

      if (games.length !== gameIds.length) {
        return NextResponse.json(
          { error: 'One or more selected games do not exist' },
          { status: 400 }
        );
      }
    } catch (e) {
      return NextResponse.json(
        { error: 'Invalid bundleInfo format' },
        { status: 400 }
      );
    }

    // Check slug uniqueness
    const existingSlug = await prisma.game.findUnique({
      where: { slug: data.slug }
    });

    if (existingSlug) {
      return NextResponse.json(
        { error: 'A product with this slug already exists' },
        { status: 400 }
      );
    }

    // Create the bundle as a Game with isBundle=true
    const bundle = await prisma.game.create({
      data: {
        title: data.title,
        slug: data.slug,
        tagline: data.tagline || null,
        description: data.description,
        priceCents: data.priceCents || 0,
        imageUrl: data.imageUrl || null,
        featured: data.featured || false,
        isNew: data.isNew ?? true,
        stock: data.stock || 100,
        bundleInfo: data.bundleInfo,
        isBundle: true,
        // Set default values for required game fields
        players: 'Varies', // Required field - bundles vary based on included games
        playerCount: data.playerCount || 'CUSTOM',
        timeToPlay: 'Varies', // Required field - bundles vary based on included games
        playTime: data.playTime || 'VARIABLE',
        ageRating: data.ageRating || 'FOURTEEN_PLUS',
        category: data.category || 'GAME',
      }
    });

    return NextResponse.json(bundle);
  } catch (error) {
    console.error('Error creating bundle:', error);
    return NextResponse.json(
      {
        error: 'Failed to create bundle',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
