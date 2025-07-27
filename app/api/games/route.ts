import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const games = await prisma.game.findMany({
      orderBy: { createdAt: 'desc' }
    });
    
    return NextResponse.json(games);
  } catch (error) {
    console.error('Error fetching games:', error);
    return NextResponse.json({ error: 'Failed to fetch games' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const game = await prisma.game.create({
      data: {
        title: body.title,
        tagline: body.tagline,
        description: body.description,
        priceCents: body.priceCents,
        players: body.players,
        timeToPlay: body.timeToPlay,
        ageRating: body.ageRating,
        imageUrl: body.imageUrl,
        isBundle: body.isBundle || false,
        isPreorder: body.isPreorder || true,
        featured: body.featured || false,
        bundleInfo: body.bundleInfo
      }
    });
    
    return NextResponse.json(game, { status: 201 });
  } catch (error) {
    console.error('Error creating game:', error);
    return NextResponse.json({ error: 'Failed to create game' }, { status: 500 });
  }
}