import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth/require-admin';

/**
 * GET /api/admin/packaging
 *
 * Returns all packaging types for fulfillment.
 *
 * Query params:
 * - active: If "true", only return active packaging types
 */
export async function GET(request: NextRequest) {
  const adminCheck = await requireAdmin();
  if (!adminCheck.authorized) return adminCheck.response;

  try {
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('active') === 'true';

    const packagingTypes = await prisma.packagingType.findMany({
      where: activeOnly ? { isActive: true } : undefined,
      orderBy: { sortOrder: 'asc' },
    });

    return NextResponse.json(packagingTypes);
  } catch (error) {
    console.error('Error fetching packaging types:', error);
    return NextResponse.json(
      { error: 'Failed to fetch packaging types' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/packaging
 *
 * Create a new packaging type.
 */
export async function POST(request: NextRequest) {
  const adminCheck = await requireAdmin();
  if (!adminCheck.authorized) return adminCheck.response;

  try {
    const body = await request.json();
    const {
      sku,
      name,
      length,
      width,
      height,
      material = 'Cardboard',
      weightOz,
      maxWeightOz,
      costCents,
      notes,
    } = body;

    if (!sku || !name || !length || !width || !height) {
      return NextResponse.json(
        { error: 'SKU, name, and dimensions are required' },
        { status: 400 }
      );
    }

    const packagingType = await prisma.packagingType.create({
      data: {
        sku,
        name,
        length,
        width,
        height,
        material,
        weightOz,
        maxWeightOz,
        costCents,
        notes,
      },
    });

    return NextResponse.json(packagingType);
  } catch (error: any) {
    console.error('Error creating packaging type:', error);
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'A packaging type with this SKU already exists' },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create packaging type' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/packaging?id=X
 *
 * Update a packaging type.
 */
export async function PUT(request: NextRequest) {
  const adminCheck = await requireAdmin();
  if (!adminCheck.authorized) return adminCheck.response;

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Packaging type ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const {
      sku,
      name,
      length,
      width,
      height,
      material,
      weightOz,
      maxWeightOz,
      costCents,
      isActive,
      sortOrder,
      notes,
    } = body;

    const packagingType = await prisma.packagingType.update({
      where: { id: parseInt(id) },
      data: {
        sku,
        name,
        length,
        width,
        height,
        material,
        weightOz,
        maxWeightOz,
        costCents,
        isActive,
        sortOrder,
        notes,
      },
    });

    return NextResponse.json(packagingType);
  } catch (error: any) {
    console.error('Error updating packaging type:', error);
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'A packaging type with this SKU already exists' },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to update packaging type' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/packaging?id=X
 *
 * Delete a packaging type.
 */
export async function DELETE(request: NextRequest) {
  const adminCheck = await requireAdmin();
  if (!adminCheck.authorized) return adminCheck.response;

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Packaging type ID is required' },
        { status: 400 }
      );
    }

    await prisma.packagingType.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({ message: 'Packaging type deleted' });
  } catch (error) {
    console.error('Error deleting packaging type:', error);
    return NextResponse.json(
      { error: 'Failed to delete packaging type' },
      { status: 500 }
    );
  }
}
