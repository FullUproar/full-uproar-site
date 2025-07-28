import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Test database connection
    const gameCount = await prisma.game.count();
    const games = await prisma.game.findMany();
    
    return NextResponse.json({
      success: true,
      gameCount,
      games,
      message: 'Database connection working'
    });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Database connection failed'
    }, { status: 500 });
  }
}