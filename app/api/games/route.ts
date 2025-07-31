import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const featured = searchParams.get('featured');
    
    const where: any = {};
    if (featured === 'true') where.featured = true;
    
    console.log('Fetching games from database...');
    const games = await prisma.game.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        images: {
          orderBy: [
            { isPrimary: 'desc' },
            { sortOrder: 'asc' }
          ]
        },
        inventory: true
      }
    });
    
    console.log(`Found ${games.length} games`);
    
    // Ensure we always return an array
    return NextResponse.json(games || []);
  } catch (error) {
    console.error('Error fetching games:', error);
    // Return more detailed error in development
    if (process.env.NODE_ENV === 'development') {
      return NextResponse.json({ 
        error: 'Failed to fetch games', 
        details: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      }, { status: 500 });
    }
    return NextResponse.json({ error: 'Failed to fetch games' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Generate slug from title
    const slug = body.title.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
    
    const game = await prisma.game.create({
      data: {
        title: body.title,
        slug: slug,
        tagline: body.tagline,
        description: body.description,
        priceCents: body.priceCents,
        players: body.playerCount || body.players || '2-4',
        playerCountCustom: body.playerCountCustom,
        timeToPlay: body.playTime || body.timeToPlay || '30-60 min',
        playTimeCustom: body.playTimeCustom,
        ageRating: body.ageRating || 'ALL_AGES',
        category: body.category || 'GAME',
        imageUrl: body.imageUrl,
        isBundle: body.isBundle || false,
        isPreorder: body.isPreorder !== undefined ? body.isPreorder : true,
        featured: body.featured || false,
        bundleInfo: body.bundleInfo,
        stock: body.stock || 0,
        tags: body.tags ? JSON.stringify(body.tags) : null,
        images: body.additionalImages ? {
          create: body.additionalImages.map((img: any, index: number) => ({
            imageUrl: img.url,
            alt: img.alt || body.title,
            isPrimary: index === 0 && !body.imageUrl,
            sortOrder: index
          }))
        } : undefined
      },
      include: {
        images: true
      }
    });
    
    return NextResponse.json(game, { status: 201 });
  } catch (error) {
    console.error('Error creating game:', error);
    return NextResponse.json({ error: 'Failed to create game' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Game ID is required' }, { status: 400 });
    }
    
    const body = await request.json();
    
    const game = await prisma.game.update({
      where: { id: parseInt(id) },
      data: {
        title: body.title,
        tagline: body.tagline,
        description: body.description,
        priceCents: body.priceCents,
        players: body.playerCount || body.players || '2-4',
        playerCountCustom: body.playerCountCustom,
        timeToPlay: body.playTime || body.timeToPlay || '30-60 min',
        playTimeCustom: body.playTimeCustom,
        ageRating: body.ageRating || 'ALL_AGES',
        category: body.category || 'GAME',
        imageUrl: body.imageUrl,
        isBundle: body.isBundle || false,
        isPreorder: body.isPreorder !== undefined ? body.isPreorder : true,
        featured: body.featured || false,
        bundleInfo: body.bundleInfo,
        stock: body.stock !== undefined ? body.stock : undefined
      }
    });
    
    return NextResponse.json(game);
  } catch (error) {
    console.error('Error updating game:', error);
    return NextResponse.json({ error: 'Failed to update game' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Game ID is required' }, { status: 400 });
    }
    
    await prisma.game.delete({
      where: { id: parseInt(id) }
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting game:', error);
    return NextResponse.json({ error: 'Failed to delete game' }, { status: 500 });
  }
}