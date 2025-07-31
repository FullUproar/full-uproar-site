import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Check if new columns exist
    const result = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'Game' 
      AND column_name IN ('playerCount', 'playTime');
    ` as any[];
    
    const hasNewColumns = result.length === 2;
    
    // Count games using raw query
    const gameCountResult = await prisma.$queryRaw`SELECT COUNT(*)::INTEGER as count FROM "Game"` as any[];
    const merchCountResult = await prisma.$queryRaw`SELECT COUNT(*)::INTEGER as count FROM "Merch"` as any[];
    
    const gameCount = Number(gameCountResult[0]?.count || 0);
    const merchCount = Number(merchCountResult[0]?.count || 0);
    
    return NextResponse.json({
      hasNewColumns,
      needsMigration: !hasNewColumns,
      stats: {
        games: gameCount,
        merch: merchCount
      },
      migrationUrl: !hasNewColumns ? '/admin/migrations' : null,
      message: !hasNewColumns 
        ? 'Database needs migration. Please run the "Add Enum Columns" migration.' 
        : 'Database is up to date'
    });
  } catch (error) {
    return NextResponse.json({
      error: 'Failed to check database status',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}