import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    // Fix game category enum values immediately
    const result = await prisma.$executeRaw`
      UPDATE "Game" 
      SET "category" = UPPER("category")
      WHERE "category" IN ('game', 'mod', 'expansion');
    `;
    
    // Also fix any null or invalid categories
    const fixNulls = await prisma.$executeRaw`
      UPDATE "Game" 
      SET "category" = 'GAME'
      WHERE "category" IS NULL 
      OR "category" NOT IN ('GAME', 'MOD', 'EXPANSION');
    `;
    
    // Count games by category using raw query to avoid enum type checking
    const counts = await prisma.$queryRaw`
      SELECT 
        "category",
        COUNT(*)::INTEGER as count
      FROM "Game"
      GROUP BY "category"
    ` as any[];
    
    const gameCount = Number(counts.find(c => c.category === 'GAME')?.count || 0);
    const modCount = Number(counts.find(c => c.category === 'MOD')?.count || 0);
    const expansionCount = Number(counts.find(c => c.category === 'EXPANSION')?.count || 0);
    
    return NextResponse.json({
      success: true,
      message: 'Fixed game category values',
      updated: Number(result),
      fixedNulls: Number(fixNulls),
      stats: {
        games: gameCount,
        mods: modCount,
        expansions: expansionCount,
        total: gameCount + modCount + expansionCount
      }
    });
  } catch (error) {
    console.error('Category fix error:', error);
    return NextResponse.json({
      error: 'Failed to fix categories',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}