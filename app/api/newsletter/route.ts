import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { rateLimit } from '@/lib/middleware/rate-limit';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  // Rate limit newsletter signups
  const rateLimitResponse = await rateLimit(request, 'promo');
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    const body = await request.json();
    const { email, name, source } = body;

    if (!email || !EMAIL_REGEX.test(email)) {
      return NextResponse.json({ error: 'Valid email required' }, { status: 400 });
    }

    // Get IP for tracking
    const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
                      request.headers.get('x-real-ip') ||
                      null;

    const subscriber = await prisma.emailSubscriber.upsert({
      where: { email: email.toLowerCase().trim() },
      update: {
        // On duplicate, update source if provided (tracks latest touchpoint)
        ...(source ? { source } : {}),
        ...(name ? { name } : {}),
        isActive: true,
      },
      create: {
        email: email.toLowerCase().trim(),
        name: name || null,
        source: source || 'homepage',
        ipAddress,
      }
    });

    return NextResponse.json({
      message: 'Successfully subscribed',
      isNew: subscriber.createdAt.getTime() === subscriber.updatedAt.getTime()
    });
  } catch (error) {
    console.error('Error subscribing to newsletter:', error);
    return NextResponse.json({ error: 'Failed to subscribe' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const stats = searchParams.get('stats');

    if (stats === 'true') {
      const [total, active, bySources] = await Promise.all([
        prisma.emailSubscriber.count(),
        prisma.emailSubscriber.count({ where: { isActive: true } }),
        prisma.emailSubscriber.groupBy({
          by: ['source'],
          _count: { id: true },
          where: { isActive: true }
        })
      ]);

      return NextResponse.json({
        total,
        active,
        bySource: bySources.reduce((acc: Record<string, number>, s) => {
          acc[s.source || 'unknown'] = s._count.id;
          return acc;
        }, {})
      });
    }

    return NextResponse.json({ error: 'Use ?stats=true' }, { status: 400 });
  } catch (error) {
    console.error('Error fetching subscriber stats:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
