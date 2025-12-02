import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { config } from '@/lib/config';
import { requireAdmin } from '@/lib/auth/require-admin';

export async function GET() {
  // Admin-only debug endpoint
  const adminCheck = await requireAdmin();
  if (!adminCheck.authorized) return adminCheck.response;
  const debugInfo = {
    environment: {
      nodeEnv: process.env.NODE_ENV,
      vercelEnv: process.env.VERCEL_ENV,
      isDevelopment: process.env.NODE_ENV === 'development',
      isProduction: process.env.NODE_ENV === 'production',
    },
    database: {
      status: 'checking',
      error: null as string | null,
    },
    tables: {},
    features: config.get('features'),
  };

  try {
    // Test database connection and get table counts
    const [
      userCount,
      gameCount,
      merchCount,
      orderCount,
      comicCount,
      artworkCount,
      orderItemCount,
      userSessionCount,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.game.count(),
      prisma.merch.count(),
      prisma.order.count(),
      prisma.comic.count(),
      prisma.artwork.count(),
      prisma.orderItem.count(),
      prisma.userSession.count(),
    ]);

    debugInfo.database.status = 'connected';
    debugInfo.tables = {
      User: userCount,
      Game: gameCount,
      Merch: merchCount,
      Order: orderCount,
      Comic: comicCount,
      Artwork: artworkCount,
      OrderItem: orderItemCount,
      UserSession: userSessionCount,
    };

  } catch (error) {
    console.error('Database error in debug endpoint:', error);
    debugInfo.database.status = 'error';
    debugInfo.database.error = error instanceof Error ? error.message : 'Unknown database error';
  }

  return NextResponse.json(debugInfo, {
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    }
  });
}