import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const hasPermission = await requirePermission('products', 'write');
    if (!hasPermission) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

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
  } catch (error) {
    console.error('Error bulk creating design components:', error);
    return NextResponse.json(
      { error: 'Failed to create design components' },
      { status: 500 }
    );
  }
}