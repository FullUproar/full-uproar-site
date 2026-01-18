import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth/require-admin';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminCheck = await requireAdmin();
    if (!adminCheck.authorized) return adminCheck.response;

    const { id } = await params;

    const redirect = await prisma.redirect.findUnique({
      where: { id: parseInt(id) },
      include: {
        scans: {
          orderBy: { scannedAt: 'desc' },
          take: 50,
        },
      },
    });

    if (!redirect) {
      return NextResponse.json({ error: 'Redirect not found' }, { status: 404 });
    }

    return NextResponse.json(redirect);
  } catch (error) {
    console.error('Error fetching redirect:', error);
    return NextResponse.json({ error: 'Failed to fetch redirect' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminCheck = await requireAdmin();
    if (!adminCheck.authorized) return adminCheck.response;

    const { id } = await params;
    const data = await request.json();

    // If updating slug, check for duplicates
    if (data.slug) {
      const slug = data.slug.toLowerCase().replace(/[^a-z0-9-]/g, '');
      const existing = await prisma.redirect.findFirst({
        where: {
          slug,
          NOT: { id: parseInt(id) },
        },
      });

      if (existing) {
        return NextResponse.json(
          { error: 'A redirect with this slug already exists' },
          { status: 400 }
        );
      }

      data.slug = slug;
    }

    const redirect = await prisma.redirect.update({
      where: { id: parseInt(id) },
      data: {
        ...(data.slug !== undefined && { slug: data.slug }),
        ...(data.destination !== undefined && { destination: data.destination }),
        ...(data.name !== undefined && { name: data.name || null }),
        ...(data.description !== undefined && { description: data.description || null }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
    });

    return NextResponse.json(redirect);
  } catch (error) {
    console.error('Error updating redirect:', error);
    return NextResponse.json({ error: 'Failed to update redirect' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminCheck = await requireAdmin();
    if (!adminCheck.authorized) return adminCheck.response;

    const { id } = await params;

    await prisma.redirect.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting redirect:', error);
    return NextResponse.json({ error: 'Failed to delete redirect' }, { status: 500 });
  }
}
