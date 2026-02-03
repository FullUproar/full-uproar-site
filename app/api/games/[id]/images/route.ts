import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Single-image types (only one allowed per game)
const SINGLE_IMAGE_TYPES = ['COVER', 'BACK', 'BOX_3D', 'LOGO'];

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const gameId = parseInt(id);

    const images = await prisma.gameImage.findMany({
      where: { gameId },
      orderBy: [
        { imageType: 'asc' },
        { isPrimary: 'desc' },
        { sortOrder: 'asc' }
      ]
    });

    return NextResponse.json(images);
  } catch (error) {
    console.error('Error fetching game images:', error);
    return NextResponse.json({ error: 'Failed to fetch images' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const gameId = parseInt(id);
    const body = await request.json();
    const imageType = body.imageType || 'COVER';

    // For single-image types, delete existing image of that type
    if (SINGLE_IMAGE_TYPES.includes(imageType)) {
      await prisma.gameImage.deleteMany({
        where: { gameId, imageType }
      });
    }

    // If this is set as primary, unset other primary images
    if (body.isPrimary) {
      await prisma.gameImage.updateMany({
        where: { gameId, isPrimary: true },
        data: { isPrimary: false }
      });
    }

    // Get current max sortOrder for this type
    const maxSort = await prisma.gameImage.aggregate({
      where: { gameId, imageType },
      _max: { sortOrder: true }
    });

    const image = await prisma.gameImage.create({
      data: {
        gameId,
        imageUrl: body.imageUrl,
        alt: body.alt,
        imageType,
        isPrimary: body.isPrimary || false,
        sortOrder: body.sortOrder ?? ((maxSort._max.sortOrder ?? -1) + 1)
      }
    });

    return NextResponse.json(image, { status: 201 });
  } catch (error) {
    console.error('Error creating game image:', error);
    return NextResponse.json({ error: 'Failed to create image' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const gameId = parseInt(id);
    const body = await request.json();
    const { imageId, ...updateData } = body;

    if (!imageId) {
      return NextResponse.json({ error: 'Image ID is required' }, { status: 400 });
    }

    // If changing to a single-image type, delete existing of that type
    if (updateData.imageType && SINGLE_IMAGE_TYPES.includes(updateData.imageType)) {
      await prisma.gameImage.deleteMany({
        where: {
          gameId,
          imageType: updateData.imageType,
          NOT: { id: parseInt(imageId) }
        }
      });
    }

    // If setting as primary, unset other primary images
    if (updateData.isPrimary) {
      await prisma.gameImage.updateMany({
        where: { gameId, isPrimary: true, NOT: { id: parseInt(imageId) } },
        data: { isPrimary: false }
      });
    }

    const image = await prisma.gameImage.update({
      where: { id: parseInt(imageId) },
      data: updateData
    });

    return NextResponse.json(image);
  } catch (error) {
    console.error('Error updating game image:', error);
    return NextResponse.json({ error: 'Failed to update image' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { searchParams } = new URL(request.url);
    const imageId = searchParams.get('imageId');

    if (!imageId) {
      return NextResponse.json({ error: 'Image ID is required' }, { status: 400 });
    }

    await prisma.gameImage.delete({
      where: { id: parseInt(imageId) }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting game image:', error);
    return NextResponse.json({ error: 'Failed to delete image' }, { status: 500 });
  }
}
