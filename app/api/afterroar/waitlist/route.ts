import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const { email, tier, source } = await req.json();

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Please provide a valid email address' },
        { status: 400 }
      );
    }

    // Check if already on waitlist
    const existing = await prisma.afterroarWaitlist.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (existing) {
      return NextResponse.json(
        {
          message: 'You\'re already on the waitlist!',
          alreadyExists: true
        },
        { status: 200 }
      );
    }

    // Add to waitlist
    const signup = await prisma.afterroarWaitlist.create({
      data: {
        email: email.toLowerCase(),
        tier: tier || null,
        source: source || 'afterroar_page'
      }
    });

    // TODO: Send confirmation email
    // TODO: Add to email marketing platform (if using one)

    return NextResponse.json({
      success: true,
      message: 'Successfully added to waitlist!',
      id: signup.id
    });

  } catch (error) {
    console.error('Error adding to waitlist:', error);
    return NextResponse.json(
      { error: 'Failed to join waitlist. Please try again.' },
      { status: 500 }
    );
  }
}

// Get waitlist stats (admin only)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const statsOnly = searchParams.get('stats') === 'true';

    if (statsOnly) {
      const total = await prisma.afterroarWaitlist.count();
      const byTier = await prisma.afterroarWaitlist.groupBy({
        by: ['tier'],
        _count: true
      });

      return NextResponse.json({
        total,
        byTier
      });
    }

    // Return full list (should add auth check here)
    const signups = await prisma.afterroarWaitlist.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100
    });

    return NextResponse.json({ signups });

  } catch (error) {
    console.error('Error fetching waitlist:', error);
    return NextResponse.json(
      { error: 'Failed to fetch waitlist' },
      { status: 500 }
    );
  }
}
