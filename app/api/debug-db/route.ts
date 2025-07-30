import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Get counts and sample data from all tables
    const [
      gameCount,
      merchCount,
      artworkCount,
      comicCount,
      newsCount,
      orderCount,
      games,
      artwork
    ] = await Promise.all([
      prisma.game.count(),
      prisma.merch.count(),
      prisma.artwork.count(),
      prisma.comic.count(),
      prisma.newsPost.count(),
      prisma.order.count(),
      prisma.game.findMany({ take: 3 }),
      prisma.artwork.findMany({ take: 3 })
    ]);

    return NextResponse.json({
      counts: {
        games: gameCount,
        merch: merchCount,
        artwork: artworkCount,
        comics: comicCount,
        news: newsCount,
        orders: orderCount
      },
      samples: {
        games: games,
        artwork: artwork
      },
      database: {
        url: process.env.DATABASE_URL?.includes('file:') ? 'SQLite' : 'PostgreSQL',
        environment: process.env.NODE_ENV
      }
    });
  } catch (error) {
    return NextResponse.json({
      error: 'Debug query failed',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}