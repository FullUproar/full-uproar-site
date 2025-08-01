import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Increase body size limit for large base64 images
export const runtime = 'nodejs';
export const maxDuration = 60;

export async function GET() {
  try {
    const artwork = await prisma.artwork.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(artwork);
  } catch (error) {
    console.error('Error fetching artwork:', error);
    return NextResponse.json({ error: 'Failed to fetch artwork' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, imageUrl, thumbnailUrl, largeUrl, category, tags, chaosMode } = body;

    const artwork = await prisma.artwork.create({
      data: {
        name,
        description,
        imageUrl,
        thumbnailUrl,
        largeUrl,
        category,
        tags,
        chaosMode: chaosMode || false
      }
    });

    return NextResponse.json(artwork);
  } catch (error) {
    console.error('Error creating artwork:', error);
    return NextResponse.json({ error: 'Failed to create artwork' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Artwork ID is required' }, { status: 400 });
    }

    const body = await request.json();
    const { name, description, imageUrl, thumbnailUrl, largeUrl, category, tags, chaosMode } = body;

    const artwork = await prisma.artwork.update({
      where: { id: parseInt(id) },
      data: {
        name,
        description,
        imageUrl,
        thumbnailUrl,
        largeUrl,
        category,
        tags,
        chaosMode: chaosMode || false
      }
    });

    return NextResponse.json(artwork);
  } catch (error) {
    console.error('Error updating artwork:', error);
    return NextResponse.json({ error: 'Failed to update artwork' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Artwork ID is required' }, { status: 400 });
    }

    await prisma.artwork.delete({
      where: { id: parseInt(id) }
    });

    return NextResponse.json({ message: 'Artwork deleted successfully' });
  } catch (error) {
    console.error('Error deleting artwork:', error);
    return NextResponse.json({ error: 'Failed to delete artwork' }, { status: 500 });
  }
}