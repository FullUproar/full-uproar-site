import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth/require-admin';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET - Get a single bundle
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const adminCheck = await requireAdmin();
    if (!adminCheck.authorized) return adminCheck.response;

    const { id } = await params;
    const bundleId = parseInt(id);

    if (isNaN(bundleId)) {
      return NextResponse.json({ error: 'Invalid bundle ID' }, { status: 400 });
    }

    const bundle = await prisma.game.findUnique({
      where: { id: bundleId, isBundle: true },
      select: {
        id: true,
        title: true,
        slug: true,
        tagline: true,
        description: true,
        priceCents: true,
        imageUrl: true,
        featured: true,
        isNew: true,
        stock: true,
        bundleInfo: true,
        createdAt: true,
      }
    });

    if (!bundle) {
      return NextResponse.json({ error: 'Bundle not found' }, { status: 404 });
    }

    return NextResponse.json(bundle);
  } catch (error) {
    console.error('Error fetching bundle:', error);
    return NextResponse.json({ error: 'Failed to fetch bundle' }, { status: 500 });
  }
}

// PUT - Update a bundle
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const adminCheck = await requireAdmin();
    if (!adminCheck.authorized) return adminCheck.response;

    const { id } = await params;
    const bundleId = parseInt(id);

    if (isNaN(bundleId)) {
      return NextResponse.json({ error: 'Invalid bundle ID' }, { status: 400 });
    }

    const data = await request.json();

    // Check if bundle exists
    const existingBundle = await prisma.game.findUnique({
      where: { id: bundleId, isBundle: true }
    });

    if (!existingBundle) {
      return NextResponse.json({ error: 'Bundle not found' }, { status: 404 });
    }

    // If bundleInfo is being updated, validate it
    if (data.bundleInfo) {
      try {
        const gameIds = JSON.parse(data.bundleInfo);
        if (!Array.isArray(gameIds) || gameIds.length < 2) {
          return NextResponse.json(
            { error: 'Bundle must include at least 2 games' },
            { status: 400 }
          );
        }

        // Verify all games exist and are not bundles themselves
        const games = await prisma.game.findMany({
          where: { id: { in: gameIds }, isBundle: false },
          select: { id: true }
        });

        if (games.length !== gameIds.length) {
          return NextResponse.json(
            { error: 'One or more selected games do not exist or are bundles' },
            { status: 400 }
          );
        }
      } catch (e) {
        return NextResponse.json(
          { error: 'Invalid bundleInfo format' },
          { status: 400 }
        );
      }
    }

    // Check slug uniqueness if slug is being changed
    if (data.slug && data.slug !== existingBundle.slug) {
      const slugExists = await prisma.game.findUnique({
        where: { slug: data.slug }
      });

      if (slugExists) {
        return NextResponse.json(
          { error: 'A product with this slug already exists' },
          { status: 400 }
        );
      }
    }

    // Update the bundle
    const updatedBundle = await prisma.game.update({
      where: { id: bundleId },
      data: {
        title: data.title,
        slug: data.slug,
        tagline: data.tagline || null,
        description: data.description,
        priceCents: data.priceCents,
        imageUrl: data.imageUrl || null,
        featured: data.featured,
        isNew: data.isNew,
        stock: data.stock,
        bundleInfo: data.bundleInfo,
        // Keep bundle-specific fields unchanged
        isBundle: true,
      }
    });

    return NextResponse.json(updatedBundle);
  } catch (error) {
    console.error('Error updating bundle:', error);
    return NextResponse.json(
      {
        error: 'Failed to update bundle',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// DELETE - Delete a bundle
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const adminCheck = await requireAdmin();
    if (!adminCheck.authorized) return adminCheck.response;

    const { id } = await params;
    const bundleId = parseInt(id);

    if (isNaN(bundleId)) {
      return NextResponse.json({ error: 'Invalid bundle ID' }, { status: 400 });
    }

    // Check if bundle exists
    const bundle = await prisma.game.findUnique({
      where: { id: bundleId, isBundle: true }
    });

    if (!bundle) {
      return NextResponse.json({ error: 'Bundle not found' }, { status: 404 });
    }

    // Check if bundle is in any orders
    const ordersWithBundle = await prisma.orderItem.findFirst({
      where: { gameId: bundleId }
    });

    if (ordersWithBundle) {
      // Soft delete - archive instead of hard delete
      await prisma.game.update({
        where: { id: bundleId },
        data: { archived: true }
      });

      return NextResponse.json({
        message: 'Bundle archived (has order history)',
        archived: true
      });
    }

    // Hard delete if no orders
    await prisma.game.delete({
      where: { id: bundleId }
    });

    return NextResponse.json({ message: 'Bundle deleted successfully' });
  } catch (error) {
    console.error('Error deleting bundle:', error);
    return NextResponse.json(
      {
        error: 'Failed to delete bundle',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
