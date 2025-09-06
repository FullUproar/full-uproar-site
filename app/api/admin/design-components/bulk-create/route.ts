import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Test if Prisma can connect and knows about DesignComponent
    try {
      await prisma.$queryRaw`SELECT 1 FROM "DesignComponent" LIMIT 1`;
    } catch (dbError: any) {
      console.error('DesignComponent table check failed:', dbError);
      return NextResponse.json(
        { 
          error: 'Database table check failed', 
          details: process.env.NODE_ENV === 'development' ? dbError.message : undefined,
          code: dbError.code,
          table: 'DesignComponent'
        },
        { status: 500 }
      );
    }
    
    await requirePermission('products', 'write');

    const body = await request.json();
    const { gameId, type, count, prefix } = body;

    if (!gameId || !type || !count || !prefix) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (count < 1 || count > 200) {
      return NextResponse.json(
        { error: 'Count must be between 1 and 200' },
        { status: 400 }
      );
    }

    // Create components in bulk
    const components = [];
    for (let i = 1; i <= count; i++) {
      const paddedNumber = i.toString().padStart(3, '0');
      components.push({
        gameId: parseInt(gameId),
        type,
        name: `${prefix} ${paddedNumber}`,
        status: 'IN_DRAFT',
        sortOrder: i
      });
    }

    const result = await prisma.designComponent.createMany({
      data: components
    });

    return NextResponse.json({
      success: true,
      count: result.count,
      message: `Created ${result.count} components`
    });
  } catch (error: any) {
    console.error('Error bulk creating design components:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create design components',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
        code: error.code
      },
      { status: 500 }
    );
  }
}