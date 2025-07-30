import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    // Simple auth check
    const url = new URL(request.url);
    const secret = url.searchParams.get('secret');
    
    if (secret !== 'add-category-2024') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Add category column to games table with default value
    await prisma.$executeRaw`
      ALTER TABLE "Game" 
      ADD COLUMN IF NOT EXISTS "category" VARCHAR(10) DEFAULT 'game';
    `;

    // Update any existing games without category
    await prisma.$executeRaw`
      UPDATE "Game" 
      SET "category" = 'game' 
      WHERE "category" IS NULL;
    `;

    // Count games and mods
    const gameCount = await prisma.game.count({ where: { category: 'game' } });
    const modCount = await prisma.game.count({ where: { category: 'mod' } });

    return NextResponse.json({
      success: true,
      message: 'Category field added to games table',
      stats: {
        games: gameCount,
        mods: modCount,
        total: gameCount + modCount
      }
    });
  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json({
      error: 'Migration failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}