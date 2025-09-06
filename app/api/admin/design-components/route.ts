import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Log the request for debugging
    console.log('[DesignComponents GET] Request received');
    
    // Check authentication
    try {
      await requirePermission('products', 'read');
      console.log('[DesignComponents GET] Authentication passed');
    } catch (authError: any) {
      console.error('[DesignComponents GET] Authentication failed:', authError);
      return NextResponse.json(
        { 
          error: 'Authentication failed',
          details: authError.message
        },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const gameId = searchParams.get('gameId');
    const type = searchParams.get('type');
    const status = searchParams.get('status');

    console.log('[DesignComponents GET] Query params:', { gameId, type, status });

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

    console.log('[DesignComponents GET] Querying with where:', where);

    const components = await prisma.designComponent.findMany({
      where,
      orderBy: [
        { type: 'asc' },
        { sortOrder: 'asc' },
        { name: 'asc' }
      ]
    });

    console.log('[DesignComponents GET] Found components:', components.length);

    return NextResponse.json(components);
  } catch (error: any) {
    console.error('[DesignComponents GET] Error:', {
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch design components',
        details: error.message,
        code: error.code,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Test database connection first
    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch (dbError: any) {
      console.error('Database connection test failed in POST:', dbError);
      return NextResponse.json(
        { 
          error: 'Database connection failed',
          details: dbError.message,
          code: dbError.code
        },
        { status: 500 }
      );
    }
    
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
  } catch (error: any) {
    console.error('Error creating design component:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create design component',
        details: error.message,
        code: error.code
      },
      { status: 500 }
    );
  }
}