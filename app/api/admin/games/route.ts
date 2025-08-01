import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const games = await prisma.game.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(games);
  } catch (error) {
    console.error('Error fetching games:', error);
    return NextResponse.json({ error: 'Failed to fetch games' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    
    console.log('Creating game with data:', JSON.stringify(data, null, 2));

    // Convert arrays to JSON strings for storage
    const processedData = {
      ...data,
      additionalDesigners: data.additionalDesigners ? JSON.stringify(data.additionalDesigners) : null,
      additionalArtists: data.additionalArtists ? JSON.stringify(data.additionalArtists) : null,
    };

    const game = await prisma.game.create({
      data: processedData
    });

    return NextResponse.json(game);
  } catch (error) {
    console.error('Error creating game:', error);
    return NextResponse.json({ 
      error: 'Failed to create game',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}