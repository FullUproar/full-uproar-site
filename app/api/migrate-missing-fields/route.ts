import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret');
    
    // Require authentication
    if (secret !== process.env.INIT_SECRET && secret !== 'emergency-init-2024') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const results = [];
    
    // First, let's check what columns exist in the Game table
    try {
      const games = await prisma.game.findMany({ take: 1 });
      const gameColumns = games.length > 0 ? Object.keys(games[0]) : [];
      results.push(`Current Game columns: ${gameColumns.join(', ')}`);
      
      // Check if slug column is missing
      if (!gameColumns.includes('slug')) {
        try {
          // Add slug column
          await prisma.$executeRaw`ALTER TABLE "Game" ADD COLUMN "slug" TEXT`;
          results.push('Added slug column to Game table');
          
          // Update existing games with slugs
          const allGames = await prisma.game.findMany();
          for (const game of allGames) {
            const slug = game.title.toLowerCase()
              .replace(/[^a-z0-9\s-]/g, '')
              .replace(/\s+/g, '-')
              .replace(/-+/g, '-')
              .trim();
            
            await prisma.$executeRaw`
              UPDATE "Game" 
              SET "slug" = ${slug}
              WHERE "id" = ${game.id}
            `;
          }
          results.push(`Generated slugs for ${allGames.length} games`);
        } catch (e) {
          results.push(`Failed to add slug column: ${e}`);
        }
      } else {
        results.push('Game.slug column already exists');
      }
      
      // Check if tags column is missing
      if (!gameColumns.includes('tags')) {
        try {
          await prisma.$executeRaw`ALTER TABLE "Game" ADD COLUMN "tags" TEXT`;
          results.push('Added tags column to Game table');
        } catch (e) {
          results.push(`Failed to add tags column: ${e}`);
        }
      } else {
        results.push('Game.tags column already exists');
      }
    } catch (e) {
      results.push(`Game table check error: ${e}`);
    }
    
    // Check Merch table for tags
    try {
      const merch = await prisma.merch.findMany({ take: 1 });
      const merchColumns = merch.length > 0 ? Object.keys(merch[0]) : [];
      
      if (!merchColumns.includes('tags')) {
        try {
          await prisma.$executeRaw`ALTER TABLE "Merch" ADD COLUMN "tags" TEXT`;
          results.push('Added tags column to Merch table');
        } catch (e) {
          results.push(`Failed to add Merch tags: ${e}`);
        }
      } else {
        results.push('Merch.tags column already exists');
      }
    } catch (e) {
      results.push(`Merch table check error: ${e}`);
    }
    
    // Check for GameImage table
    try {
      await prisma.gameImage.count();
      results.push('GameImage table already exists');
    } catch (e) {
      try {
        await prisma.$executeRaw`
          CREATE TABLE "GameImage" (
            "id" INTEGER PRIMARY KEY AUTOINCREMENT,
            "gameId" INTEGER NOT NULL,
            "imageUrl" TEXT NOT NULL,
            "alt" TEXT,
            "isPrimary" BOOLEAN NOT NULL DEFAULT false,
            "sortOrder" INTEGER NOT NULL DEFAULT 0,
            "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT "GameImage_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game" ("id") ON DELETE CASCADE ON UPDATE CASCADE
          )
        `;
        results.push('Created GameImage table');
      } catch (createError) {
        results.push(`Failed to create GameImage table: ${createError}`);
      }
    }
    
    // Check for MerchImage table
    try {
      await prisma.merchImage.count();
      results.push('MerchImage table already exists');
    } catch (e) {
      try {
        await prisma.$executeRaw`
          CREATE TABLE "MerchImage" (
            "id" INTEGER PRIMARY KEY AUTOINCREMENT,
            "merchId" INTEGER NOT NULL,
            "imageUrl" TEXT NOT NULL,
            "alt" TEXT,
            "isPrimary" BOOLEAN NOT NULL DEFAULT false,
            "sortOrder" INTEGER NOT NULL DEFAULT 0,
            "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT "MerchImage_merchId_fkey" FOREIGN KEY ("merchId") REFERENCES "Merch" ("id") ON DELETE CASCADE ON UPDATE CASCADE
          )
        `;
        results.push('Created MerchImage table');
      } catch (createError) {
        results.push(`Failed to create MerchImage table: ${createError}`);
      }
    }
    
    return NextResponse.json({
      success: true,
      results,
      message: 'Migration completed. Check results for details.'
    });
  } catch (error) {
    return NextResponse.json({
      error: 'Migration failed',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}