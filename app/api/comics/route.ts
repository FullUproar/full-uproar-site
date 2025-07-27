import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const comics = await prisma.comic.findMany({
      orderBy: { createdAt: 'desc' }
    });
    
    return NextResponse.json(comics);
  } catch (error) {
    console.error('Error fetching comics:', error);
    return NextResponse.json({ error: 'Failed to fetch comics' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const comic = await prisma.comic.create({
      data: {
        title: body.title,
        episode: body.episode,
        description: body.description,
        imageUrl: body.imageUrl
      }
    });
    
    return NextResponse.json(comic, { status: 201 });
  } catch (error) {
    console.error('Error creating comic:', error);
    return NextResponse.json({ error: 'Failed to create comic' }, { status: 500 });
  }
}