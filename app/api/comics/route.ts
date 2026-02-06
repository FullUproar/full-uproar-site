import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const comics = await prisma.comic.findMany({
      orderBy: { createdAt: 'desc' }
    });
    
    return NextResponse.json(comics, {
      headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' },
    });
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

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Comic ID is required' }, { status: 400 });
    }
    
    const body = await request.json();
    
    const comic = await prisma.comic.update({
      where: { id: parseInt(id) },
      data: {
        title: body.title,
        episode: body.episode,
        description: body.description,
        imageUrl: body.imageUrl
      }
    });
    
    return NextResponse.json(comic);
  } catch (error) {
    console.error('Error updating comic:', error);
    return NextResponse.json({ error: 'Failed to update comic' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Comic ID is required' }, { status: 400 });
    }
    
    await prisma.comic.delete({
      where: { id: parseInt(id) }
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting comic:', error);
    return NextResponse.json({ error: 'Failed to delete comic' }, { status: 500 });
  }
}