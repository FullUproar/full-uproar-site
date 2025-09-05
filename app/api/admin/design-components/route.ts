import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    await requirePermission('products', 'read');

    const searchParams = request.nextUrl.searchParams;
    const gameId = searchParams.get('gameId');
    const type = searchParams.get('type');
    const status = searchParams.get('status');

    const where: any = {};
    
    if (gameId) {
      where.gameId = parseInt(gameId);
    }
    
    if (type && type !== 'all') {
      where.type = type;
    }
    
    if (status && status !== 'all') {
      where.status = status;
    }

    const components = await prisma.designComponent.findMany({
      where,
      include: {
        game: {
          select: {
            id: true,
            title: true,
            slug: true
          }
        }
      },
      orderBy: [
        { type: 'asc' },
        { sortOrder: 'asc' },
        { name: 'asc' }
      ]
    });

    return NextResponse.json(components);
  } catch (error) {
    console.error('Error fetching design components:', error);
    return NextResponse.json(
      { error: 'Failed to fetch design components' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await requirePermission('products', 'write');

    const body = await request.json();
    const { gameId, type, name, description, status, previewUrl, notes, sortOrder } = body;

    const component = await prisma.designComponent.create({
      data: {
        gameId,
        type,
        name,
        description,
        status: status || 'IN_DRAFT',
        previewUrl,
        notes,
        sortOrder: sortOrder || 0
      }
    });

    return NextResponse.json(component);
  } catch (error) {
    console.error('Error creating design component:', error);
    return NextResponse.json(
      { error: 'Failed to create design component' },
      { status: 500 }
    );
  }
}