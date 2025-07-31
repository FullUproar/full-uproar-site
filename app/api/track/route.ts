import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';
import { headers } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    const body = await request.json();
    const { action, productType, productId, metadata } = body;

    // Get session ID from cookie or create new one
    const sessionId = request.cookies.get('sessionId')?.value || 
      `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    // Get IP and user agent
    const headersList = await headers();
    const ipAddress = headersList.get('x-forwarded-for')?.split(',')[0] || 
                     headersList.get('x-real-ip') || 
                     'unknown';
    const userAgent = headersList.get('user-agent') || '';

    // Track the view
    if (action === 'view') {
      await prisma.productView.create({
        data: {
          productType,
          productId: parseInt(productId),
          userId,
          sessionId,
          ipAddress,
          userAgent
        }
      });
    }

    // Track user activity if logged in
    if (userId) {
      await prisma.userActivity.create({
        data: {
          userId,
          action,
          targetType: productType,
          targetId: parseInt(productId),
          metadata: metadata ? JSON.stringify(metadata) : null
        }
      });
    }

    // Get current viewers count (last 5 minutes)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const viewers = await prisma.productView.findMany({
      where: {
        productType,
        productId: parseInt(productId),
        createdAt: { gte: fiveMinutesAgo }
      },
      distinct: ['sessionId'],
      select: { sessionId: true }
    });
    const viewersCount = viewers.length;

    // Set session cookie if new
    const response = NextResponse.json({ 
      success: true,
      viewersCount 
    });

    if (!request.cookies.get('sessionId')) {
      response.cookies.set('sessionId', sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30 // 30 days
      });
    }

    return response;
  } catch (error) {
    console.error('Tracking error:', error);
    return NextResponse.json(
      { error: 'Failed to track activity' },
      { status: 500 }
    );
  }
}

// Get viewing stats
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const productType = searchParams.get('type');
    const productId = searchParams.get('id');

    if (!productType || !productId) {
      return NextResponse.json(
        { error: 'Missing parameters' },
        { status: 400 }
      );
    }

    // Get viewers in last 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const viewers = await prisma.productView.findMany({
      where: {
        productType,
        productId: parseInt(productId),
        createdAt: { gte: fiveMinutesAgo }
      },
      distinct: ['sessionId'],
      select: { sessionId: true }
    });
    const viewersCount = viewers.length;

    // Get total views today
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    
    const todayViews = await prisma.productView.count({
      where: {
        productType,
        productId: parseInt(productId),
        createdAt: { gte: startOfDay }
      }
    });

    return NextResponse.json({
      currentViewers: viewersCount,
      todayViews,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}