import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const results = [];
    
    // Add lead designer and lead artist fields
    try {
      await prisma.$executeRaw`
        ALTER TABLE "Game" 
        ADD COLUMN IF NOT EXISTS "leadDesigner" VARCHAR(255),
        ADD COLUMN IF NOT EXISTS "leadArtist" VARCHAR(255),
        ADD COLUMN IF NOT EXISTS "additionalDesigners" TEXT,
        ADD COLUMN IF NOT EXISTS "additionalArtists" TEXT;
      `;
      results.push('Added lead and additional credit fields');
    } catch (error) {
      results.push(`Credit fields may already exist: ${error}`);
    }

    // Add enhanced launch date fields
    try {
      await prisma.$executeRaw`
        ALTER TABLE "Game" 
        ADD COLUMN IF NOT EXISTS "launchYear" INTEGER,
        ADD COLUMN IF NOT EXISTS "launchMonth" INTEGER,
        ADD COLUMN IF NOT EXISTS "launchDay" INTEGER,
        ADD COLUMN IF NOT EXISTS "launchHour" INTEGER,
        ADD COLUMN IF NOT EXISTS "launchMinute" INTEGER;
      `;
      results.push('Added granular launch date fields');
    } catch (error) {
      results.push(`Launch date fields may already exist: ${error}`);
    }

    // Migrate existing designer/artist to lead fields
    try {
      await prisma.$executeRaw`
        UPDATE "Game" 
        SET "leadDesigner" = "designer",
            "leadArtist" = "artist"
        WHERE "designer" IS NOT NULL OR "artist" IS NOT NULL;
      `;
      results.push('Migrated existing designers/artists to lead fields');
    } catch (error) {
      results.push(`Migration of existing credits: ${error}`);
    }

    // Parse existing launchDate to granular fields
    try {
      await prisma.$executeRaw`
        UPDATE "Game" 
        SET 
          "launchYear" = EXTRACT(YEAR FROM "launchDate" AT TIME ZONE 'America/New_York'),
          "launchMonth" = EXTRACT(MONTH FROM "launchDate" AT TIME ZONE 'America/New_York'),
          "launchDay" = EXTRACT(DAY FROM "launchDate" AT TIME ZONE 'America/New_York'),
          "launchHour" = EXTRACT(HOUR FROM "launchDate" AT TIME ZONE 'America/New_York'),
          "launchMinute" = EXTRACT(MINUTE FROM "launchDate" AT TIME ZONE 'America/New_York')
        WHERE "launchDate" IS NOT NULL;
      `;
      results.push('Migrated existing launch dates to granular fields');
    } catch (error) {
      results.push(`Launch date migration: ${error}`);
    }

    return NextResponse.json({
      success: true,
      message: 'Enhanced credits and launch date fields added',
      results
    });
  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json({
      error: 'Migration failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}