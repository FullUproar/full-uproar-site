import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Try to count games as a simple health check
    const gameCount = await prisma.game.count();
    const merchCount = await prisma.merch.count();
    const orderCount = await prisma.order.count();
    
    return NextResponse.json({
      status: 'healthy',
      database: 'connected',
      counts: {
        games: gameCount,
        merch: merchCount,
        orders: orderCount
      }
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    // Check for common Prisma errors
    if (errorMessage.includes('P2021') || errorMessage.includes('table') || errorMessage.includes('relation')) {
      return NextResponse.json({
        status: 'unhealthy',
        database: 'missing tables',
        error: 'Database tables not found',
        solution: 'Run database migrations in production',
        details: errorMessage
      }, { status: 503 });
    }
    
    return NextResponse.json({
      status: 'unhealthy',
      database: 'error',
      error: errorMessage
    }, { status: 503 });
  }
}