import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { rateLimit } from '@/lib/middleware/rate-limit';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const rateLimitResponse = await rateLimit(request, 'promo');
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const { id } = await params;
    const gameId = parseInt(id);
    if (isNaN(gameId)) {
      return NextResponse.json({ error: 'Invalid game ID' }, { status: 400 });
    }

    const body = await request.json();
    const { email } = body;

    if (!email || !EMAIL_REGEX.test(email)) {
      return NextResponse.json({ error: 'Valid email required' }, { status: 400 });
    }

    // Check game exists
    const game = await prisma.game.findUnique({
      where: { id: gameId },
      select: { id: true, title: true, stock: true },
    });

    if (!game) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }

    // If already in stock, let them know
    if (game.stock > 0) {
      return NextResponse.json({
        message: `${game.title} is currently in stock! Add it to your cart.`,
        inStock: true,
      });
    }

    // Upsert — idempotent, same email+game won't duplicate
    await prisma.stockNotification.upsert({
      where: { email_gameId: { email: email.toLowerCase(), gameId } },
      update: { notified: false, notifiedAt: null },
      create: { email: email.toLowerCase(), gameId },
    });

    return NextResponse.json({
      message: "You're on the list! We'll email you when it's back in stock.",
      inStock: false,
    });
  } catch (error) {
    console.error('Stock notification signup error:', error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
