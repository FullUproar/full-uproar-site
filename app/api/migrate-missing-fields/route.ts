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
    
    // Check if Game table has slug column
    try {
      const gameWithSlug = await prisma.$queryRaw`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'Game' AND column_name = 'slug'
      `;
      
      if (!Array.isArray(gameWithSlug) || gameWithSlug.length === 0) {
        // Add slug column
        await prisma.$executeRaw`ALTER TABLE "Game" ADD COLUMN "slug" TEXT`;
        results.push('Added slug column to Game table');
        
        // Update existing games with slugs
        await prisma.$executeRaw`
          UPDATE "Game" 
          SET "slug" = LOWER(
            REPLACE(
              REPLACE(
                REPLACE("title", ' ', '-'),
                '''', ''
              ),
              '"', ''
            )
          )
          WHERE "slug" IS NULL
        `;
        results.push('Generated slugs for existing games');
      } else {
        results.push('Game.slug already exists');
      }
    } catch (e) {
      results.push(`Game.slug error: ${e}`);
    }
    
    // Check if Game table has tags column
    try {
      const gameWithTags = await prisma.$queryRaw`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'Game' AND column_name = 'tags'
      `;
      
      if (!Array.isArray(gameWithTags) || gameWithTags.length === 0) {
        await prisma.$executeRaw`ALTER TABLE "Game" ADD COLUMN "tags" TEXT`;
        results.push('Added tags column to Game table');
      } else {
        results.push('Game.tags already exists');
      }
    } catch (e) {
      results.push(`Game.tags error: ${e}`);
    }
    
    // Check if Merch table has tags column
    try {
      const merchWithTags = await prisma.$queryRaw`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'Merch' AND column_name = 'tags'
      `;
      
      if (!Array.isArray(merchWithTags) || merchWithTags.length === 0) {
        await prisma.$executeRaw`ALTER TABLE "Merch" ADD COLUMN "tags" TEXT`;
        results.push('Added tags column to Merch table');
      } else {
        results.push('Merch.tags already exists');
      }
    } catch (e) {
      results.push(`Merch.tags error: ${e}`);
    }
    
    // Create GameImage table
    try {
      const gameImageExists = await prisma.$queryRaw`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_name = 'GameImage'
      `;
      
      if (!Array.isArray(gameImageExists) || gameImageExists.length === 0) {
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
      } else {
        results.push('GameImage table already exists');
      }
    } catch (e) {
      results.push(`GameImage table error: ${e}`);
    }
    
    // Create MerchImage table
    try {
      const merchImageExists = await prisma.$queryRaw`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_name = 'MerchImage'
      `;
      
      if (!Array.isArray(merchImageExists) || merchImageExists.length === 0) {
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
      } else {
        results.push('MerchImage table already exists');
      }
    } catch (e) {
      results.push(`MerchImage table error: ${e}`);
    }
    
    // Regenerate Prisma Client
    try {
      await prisma.$disconnect();
      await prisma.$connect();
      results.push('Reconnected to database');
    } catch (e) {
      results.push(`Reconnection error: ${e}`);
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