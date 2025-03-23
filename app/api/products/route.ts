import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  const body = await req.json();

  if (
    !body.name ||
    !body.slug ||
    !body.priceCents ||
    !body.imageUrl ||
    body.stock == null
  ) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  try {
    const product = await prisma.product.create({
      data: {
        name: body.name,
        slug: body.slug,
        priceCents: body.priceCents,
        imageUrl: body.imageUrl,
        stock: body.stock,
      },
    });

    return NextResponse.json({ product }, { status: 201 });
  } catch (err: any) {
    console.error('Error creating product:', err);
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
  }
}
