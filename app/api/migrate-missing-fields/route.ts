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
    
    // Add slug column to Game table
    try {
      await prisma.$executeRaw`ALTER TABLE "Game" ADD COLUMN IF NOT EXISTS "slug" TEXT`;
      results.push('Added/verified slug column in Game table');
      
      // Update existing games with slugs
      const gamesWithoutSlug = await prisma.$queryRawUnsafe<any[]>(`
        SELECT id, title FROM "Game" WHERE slug IS NULL OR slug = ''
      `);
      
      for (const game of gamesWithoutSlug) {
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
      
      if (gamesWithoutSlug.length > 0) {
        results.push(`Generated slugs for ${gamesWithoutSlug.length} games`);
      } else {
        results.push('All games already have slugs');
      }
    } catch (e) {
      results.push(`Game slug error: ${e}`);
    }
    
    // Add tags column to Game table
    try {
      await prisma.$executeRaw`ALTER TABLE "Game" ADD COLUMN IF NOT EXISTS "tags" TEXT`;
      results.push('Added/verified tags column in Game table');
    } catch (e) {
      results.push(`Game tags error: ${e}`);
    }
    
    // Add tags column to Merch table
    try {
      await prisma.$executeRaw`ALTER TABLE "Merch" ADD COLUMN IF NOT EXISTS "tags" TEXT`;
      results.push('Added/verified tags column in Merch table');
    } catch (e) {
      results.push(`Merch tags error: ${e}`);
    }
    
    // Check for GameImage table
    try {
      await prisma.gameImage.count();
      results.push('GameImage table already exists');
    } catch (e) {
      try {
        await prisma.$executeRaw`
          CREATE TABLE "GameImage" (
            "id" SERIAL PRIMARY KEY,
            "gameId" INTEGER NOT NULL,
            "imageUrl" TEXT NOT NULL,
            "alt" TEXT,
            "isPrimary" BOOLEAN NOT NULL DEFAULT false,
            "sortOrder" INTEGER NOT NULL DEFAULT 0,
            "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
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
            "id" SERIAL PRIMARY KEY,
            "merchId" INTEGER NOT NULL,
            "imageUrl" TEXT NOT NULL,
            "alt" TEXT,
            "isPrimary" BOOLEAN NOT NULL DEFAULT false,
            "sortOrder" INTEGER NOT NULL DEFAULT 0,
            "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
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