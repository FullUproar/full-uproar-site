import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth/require-admin';

export async function GET() {
  try {
    const adminCheck = await requireAdmin();
    if (!adminCheck.authorized) return adminCheck.response;

    const redirects = await prisma.redirect.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(redirects);
  } catch (error) {
    console.error('Error fetching redirects:', error);
    return NextResponse.json({ error: 'Failed to fetch redirects' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const adminCheck = await requireAdmin();
    if (!adminCheck.authorized) return adminCheck.response;

    const data = await request.json();

    // Validate required fields
    if (!data.slug || !data.destination) {
      return NextResponse.json(
        { error: 'Slug and destination are required' },
        { status: 400 }
      );
    }

    // Clean slug (lowercase, alphanumeric and hyphens only)
    const slug = data.slug.toLowerCase().replace(/[^a-z0-9-]/g, '');

    // Check for duplicate slug
    const existing = await prisma.redirect.findUnique({
      where: { slug },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'A redirect with this slug already exists' },
        { status: 400 }
      );
    }

    const redirect = await prisma.redirect.create({
      data: {
        slug,
        destination: data.destination,
        name: data.name || null,
        description: data.description || null,
        isActive: data.isActive ?? true,
        createdBy: adminCheck.userId,
      },
    });

    return NextResponse.json(redirect);
  } catch (error) {
    console.error('Error creating redirect:', error);
    return NextResponse.json(
      { error: 'Failed to create redirect' },
      { status: 500 }
    );
  }
}
