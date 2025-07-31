import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const results = [];
    
    // Add playerCount column with default
    try {
      await prisma.$executeRaw`
        ALTER TABLE "Game" 
        ADD COLUMN IF NOT EXISTS "playerCount" VARCHAR(20) DEFAULT 'TWO_TO_FOUR';
      `;
      results.push('Added playerCount column');
    } catch (error) {
      results.push(`playerCount column may already exist: ${error}`);
    }

    // Add playTime column with default
    try {
      await prisma.$executeRaw`
        ALTER TABLE "Game" 
        ADD COLUMN IF NOT EXISTS "playTime" VARCHAR(20) DEFAULT 'MEDIUM';
      `;
      results.push('Added playTime column');
    } catch (error) {
      results.push(`playTime column may already exist: ${error}`);
    }

    // Add new boolean columns
    try {
      await prisma.$executeRaw`
        ALTER TABLE "Game" 
        ADD COLUMN IF NOT EXISTS "isNew" BOOLEAN DEFAULT false,
        ADD COLUMN IF NOT EXISTS "isBestseller" BOOLEAN DEFAULT false;
      `;
      results.push('Added isNew and isBestseller columns');
    } catch (error) {
      results.push(`Boolean columns may already exist: ${error}`);
    }

    // Add launchDate column
    try {
      await prisma.$executeRaw`
        ALTER TABLE "Game" 
        ADD COLUMN IF NOT EXISTS "launchDate" TIMESTAMP;
      `;
      results.push('Added launchDate column');
    } catch (error) {
      results.push(`launchDate column may already exist: ${error}`);
    }

    // Add game details columns
    try {
      await prisma.$executeRaw`
        ALTER TABLE "Game" 
        ADD COLUMN IF NOT EXISTS "designer" VARCHAR(255),
        ADD COLUMN IF NOT EXISTS "artist" VARCHAR(255),
        ADD COLUMN IF NOT EXISTS "publisher" VARCHAR(255),
        ADD COLUMN IF NOT EXISTS "bggUrl" VARCHAR(500),
        ADD COLUMN IF NOT EXISTS "whatsInTheBox" TEXT,
        ADD COLUMN IF NOT EXISTS "howToPlay" TEXT,
        ADD COLUMN IF NOT EXISTS "videoUrl" VARCHAR(500);
      `;
      results.push('Added game detail columns');
    } catch (error) {
      results.push(`Game detail columns may already exist: ${error}`);
    }

    // Update ageRating column type if needed
    try {
      await prisma.$executeRaw`
        ALTER TABLE "Game" 
        ALTER COLUMN "ageRating" TYPE VARCHAR(20);
      `;
      results.push('Updated ageRating column type');
    } catch (error) {
      results.push(`ageRating column type update: ${error}`);
    }

    // Migrate existing data to enum values
    try {
      // Map old players values to playerCount enum
      await prisma.$executeRaw`
        UPDATE "Game" 
        SET "playerCount" = CASE
          WHEN "players" = '1' THEN 'SINGLE'
          WHEN "players" = '2' THEN 'TWO'
          WHEN "players" = '2-4' THEN 'TWO_TO_FOUR'
          WHEN "players" = '2-6' THEN 'TWO_TO_SIX'
          WHEN "players" = '3-5' THEN 'THREE_TO_FIVE'
          WHEN "players" = '3-6' THEN 'THREE_TO_SIX'
          WHEN "players" = '4-8' THEN 'FOUR_TO_EIGHT'
          WHEN "players" LIKE '%+%' THEN 'PARTY'
          WHEN "players" = 'Any' OR "players" = 'Variable' THEN 'CUSTOM'
          ELSE 'TWO_TO_FOUR'
        END
        WHERE "playerCount" IS NULL OR "playerCount" = 'TWO_TO_FOUR';
      `;
      results.push('Migrated players to playerCount');
    } catch (error) {
      results.push(`Players migration error: ${error}`);
    }

    try {
      // Map old timeToPlay values to playTime enum
      await prisma.$executeRaw`
        UPDATE "Game" 
        SET "playTime" = CASE
          WHEN "timeToPlay" LIKE '%15%' OR "timeToPlay" LIKE '%20%' THEN 'QUICK'
          WHEN "timeToPlay" LIKE '%30%' OR "timeToPlay" LIKE '%45%' THEN 'SHORT'
          WHEN "timeToPlay" LIKE '%60%' OR "timeToPlay" LIKE '%90%' THEN 'MEDIUM'
          WHEN "timeToPlay" LIKE '%120%' THEN 'LONG'
          WHEN "timeToPlay" LIKE '%hour%' THEN 'EXTENDED'
          WHEN "timeToPlay" = 'Variable' THEN 'VARIABLE'
          ELSE 'MEDIUM'
        END
        WHERE "playTime" IS NULL OR "playTime" = 'MEDIUM';
      `;
      results.push('Migrated timeToPlay to playTime');
    } catch (error) {
      results.push(`TimeToPlay migration error: ${error}`);
    }

    try {
      // Map old ageRating values to enum
      await prisma.$executeRaw`
        UPDATE "Game" 
        SET "ageRating" = CASE
          WHEN "ageRating" = 'All Ages' OR "ageRating" = '0+' THEN 'ALL_AGES'
          WHEN "ageRating" = '11+' OR "ageRating" = '10+' THEN 'ELEVEN_PLUS'
          WHEN "ageRating" = '14+' OR "ageRating" = '13+' THEN 'FOURTEEN_PLUS'
          WHEN "ageRating" = '16+' OR "ageRating" = '15+' THEN 'SIXTEEN_PLUS'
          WHEN "ageRating" = '18+' OR "ageRating" = '17+' THEN 'EIGHTEEN_PLUS'
          WHEN "ageRating" = '21+' THEN 'TWENTYONE_PLUS'
          ELSE 'FOURTEEN_PLUS'
        END
        WHERE "ageRating" NOT IN ('ALL_AGES', 'ELEVEN_PLUS', 'FOURTEEN_PLUS', 'SIXTEEN_PLUS', 'EIGHTEEN_PLUS', 'TWENTYONE_PLUS');
      `;
      results.push('Migrated ageRating to enum values');
    } catch (error) {
      results.push(`AgeRating migration error: ${error}`);
    }

    // Add merch columns
    try {
      await prisma.$executeRaw`
        ALTER TABLE "Merch" 
        ADD COLUMN IF NOT EXISTS "material" VARCHAR(255),
        ADD COLUMN IF NOT EXISTS "careInstructions" TEXT,
        ADD COLUMN IF NOT EXISTS "fit" VARCHAR(50),
        ADD COLUMN IF NOT EXISTS "isNew" BOOLEAN DEFAULT false,
        ADD COLUMN IF NOT EXISTS "isBestseller" BOOLEAN DEFAULT false,
        ADD COLUMN IF NOT EXISTS "isLimitedEdition" BOOLEAN DEFAULT false,
        ADD COLUMN IF NOT EXISTS "releaseDate" TIMESTAMP;
      `;
      results.push('Added merch columns');
    } catch (error) {
      results.push(`Merch columns may already exist: ${error}`);
    }

    // Update merch category if needed
    try {
      await prisma.$executeRaw`
        UPDATE "Merch" 
        SET "category" = CASE
          WHEN LOWER("category") = 'apparel' THEN 'APPAREL'
          WHEN LOWER("category") = 'accessories' THEN 'ACCESSORIES'
          WHEN LOWER("category") = 'home_goods' THEN 'HOME_GOODS'
          WHEN LOWER("category") = 'collectibles' THEN 'COLLECTIBLES'
          WHEN LOWER("category") = 'stickers' THEN 'STICKERS'
          WHEN LOWER("category") = 'prints' THEN 'PRINTS'
          ELSE 'OTHER'
        END
        WHERE "category" NOT IN ('APPAREL', 'ACCESSORIES', 'HOME_GOODS', 'COLLECTIBLES', 'STICKERS', 'PRINTS', 'OTHER');
      `;
      results.push('Updated merch categories to enum values');
    } catch (error) {
      results.push(`Merch category update error: ${error}`);
    }

    // Count results
    const gameCount = await prisma.game.count();
    const merchCount = await prisma.merch.count();

    return NextResponse.json({
      success: true,
      message: 'Database schema updated with enum columns',
      results,
      stats: {
        games: gameCount,
        merch: merchCount
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