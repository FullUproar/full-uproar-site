import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const merchId = parseInt(id);
    
    const images = await prisma.merchImage.findMany({
      where: { merchId },
      orderBy: [
        { isPrimary: 'desc' },
        { sortOrder: 'asc' }
      ]
    });
    
    return NextResponse.json(images);
  } catch (error) {
    console.error('Error fetching merch images:', error);
    return NextResponse.json({ error: 'Failed to fetch images' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const merchId = parseInt(id);
    const body = await request.json();
    
    // If this is set as primary, unset other primary images
    if (body.isPrimary) {
      await prisma.merchImage.updateMany({
        where: { merchId, isPrimary: true },
        data: { isPrimary: false }
      });
    }
    
    const image = await prisma.merchImage.create({
      data: {
        merchId,
        imageUrl: body.imageUrl,
        alt: body.alt,
        isPrimary: body.isPrimary || false,
        sortOrder: body.sortOrder || 0
      }
    });
    
    return NextResponse.json(image, { status: 201 });
  } catch (error) {
    console.error('Error creating merch image:', error);
    return NextResponse.json({ error: 'Failed to create image' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const merchId = parseInt(id);
    const body = await request.json();
    const { imageId, ...updateData } = body;
    
    if (!imageId) {
      return NextResponse.json({ error: 'Image ID is required' }, { status: 400 });
    }
    
    // If setting as primary, unset other primary images
    if (updateData.isPrimary) {
      await prisma.merchImage.updateMany({
        where: { merchId, isPrimary: true, NOT: { id: parseInt(imageId) } },
        data: { isPrimary: false }
      });
    }
    
    const image = await prisma.merchImage.update({
      where: { id: parseInt(imageId) },
      data: updateData
    });
    
    return NextResponse.json(image);
  } catch (error) {
    console.error('Error updating merch image:', error);
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
    
    await prisma.merchImage.delete({
      where: { id: parseInt(imageId) }
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting merch image:', error);
    return NextResponse.json({ error: 'Failed to delete image' }, { status: 500 });
  }
}