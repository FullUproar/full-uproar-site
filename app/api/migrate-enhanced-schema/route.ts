import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Mapping functions for converting old values to new enums
const mapAgeRating = (oldRating: string): string => {
  const mapping: Record<string, string> = {
    'All Ages': 'ALL_AGES',
    '11+': 'ELEVEN_PLUS',
    '13+': 'FOURTEEN_PLUS', // Map 13+ to 14+
    '14+': 'FOURTEEN_PLUS',
    '16+': 'SIXTEEN_PLUS',
    '18+': 'EIGHTEEN_PLUS',
    '21+': 'TWENTYONE_PLUS'
  };
  return mapping[oldRating] || 'ALL_AGES';
};

const mapPlayerCount = (oldPlayers: string): string => {
  const normalized = oldPlayers.toLowerCase().replace(/\s+/g, '');
  
  if (normalized.includes('1player') || normalized === '1') return 'SINGLE';
  if (normalized === '2players' || normalized === '2') return 'TWO';
  if (normalized.includes('2-4')) return 'TWO_TO_FOUR';
  if (normalized.includes('2-6')) return 'TWO_TO_SIX';
  if (normalized.includes('3-5')) return 'THREE_TO_FIVE';
  if (normalized.includes('3-6')) return 'THREE_TO_SIX';
  if (normalized.includes('4-8')) return 'FOUR_TO_EIGHT';
  if (normalized.includes('6+') || normalized.includes('party')) return 'PARTY';
  
  return 'CUSTOM';
};

const mapPlayTime = (oldTime: string): string => {
  const normalized = oldTime.toLowerCase();
  
  if (normalized.includes('under 30') || normalized.includes('< 30')) return 'QUICK';
  if (normalized.includes('30-60') || normalized.includes('30-45')) return 'SHORT';
  if (normalized.includes('60-90') || normalized.includes('45-90')) return 'MEDIUM';
  if (normalized.includes('90-120')) return 'LONG';
  if (normalized.includes('2+') || normalized.includes('120+')) return 'EXTENDED';
  if (normalized.includes('varies') || normalized.includes('variable')) return 'VARIABLE';
  
  // Try to parse minutes
  const minutes = parseInt(normalized.match(/\d+/)?.[0] || '0');
  if (minutes > 0 && minutes < 30) return 'QUICK';
  if (minutes >= 30 && minutes < 60) return 'SHORT';
  if (minutes >= 60 && minutes < 90) return 'MEDIUM';
  if (minutes >= 90 && minutes < 120) return 'LONG';
  if (minutes >= 120) return 'EXTENDED';
  
  return 'MEDIUM';
};

const mapGameCategory = (oldCategory: string): string => {
  const normalized = oldCategory.toLowerCase();
  if (normalized === 'mod') return 'MOD';
  if (normalized === 'expansion') return 'EXPANSION';
  return 'GAME';
};

const mapMerchCategory = (oldCategory: string): string => {
  const normalized = oldCategory.toLowerCase();
  if (normalized === 'apparel' || normalized === 'clothing') return 'APPAREL';
  if (normalized === 'accessories') return 'ACCESSORIES';
  if (normalized === 'home' || normalized === 'home goods') return 'HOME_GOODS';
  if (normalized === 'collectibles') return 'COLLECTIBLES';
  if (normalized === 'stickers') return 'STICKERS';
  if (normalized === 'prints' || normalized === 'posters') return 'PRINTS';
  return 'OTHER';
};

export async function POST(request: NextRequest) {
  try {
    const results = {
      gamesUpdated: 0,
      merchUpdated: 0,
      columnsAdded: [] as string[],
      errors: [] as string[]
    };

    // First, add new columns to Games table
    const gameColumns = [
      { name: 'isNew', type: 'BOOLEAN DEFAULT FALSE' },
      { name: 'isBestseller', type: 'BOOLEAN DEFAULT FALSE' },
      { name: 'playerCountCustom', type: 'VARCHAR(255)' },
      { name: 'playTimeCustom', type: 'VARCHAR(255)' },
      { name: 'setupTime', type: 'VARCHAR(255)' },
      { name: 'difficulty', type: 'VARCHAR(255)' },
      { name: 'designer', type: 'VARCHAR(255)' },
      { name: 'artist', type: 'VARCHAR(255)' },
      { name: 'publisher', type: 'VARCHAR(255) DEFAULT \'Full Uproar Games\'' },
      { name: 'releaseYear', type: 'INTEGER' },
      { name: 'bggUrl', type: 'VARCHAR(255)' }
    ];

    for (const col of gameColumns) {
      try {
        await prisma.$executeRawUnsafe(`
          ALTER TABLE "Game" 
          ADD COLUMN IF NOT EXISTS "${col.name}" ${col.type}
        `);
        results.columnsAdded.push(`Game.${col.name}`);
      } catch (error) {
        // Column might already exist
      }
    }

    // Add new columns to Merch table
    const merchColumns = [
      { name: 'isNew', type: 'BOOLEAN DEFAULT FALSE' },
      { name: 'isBestseller', type: 'BOOLEAN DEFAULT FALSE' },
      { name: 'colors', type: 'TEXT' },
      { name: 'material', type: 'VARCHAR(255)' },
      { name: 'careInstructions', type: 'TEXT' },
      { name: 'fitDescription', type: 'VARCHAR(255)' },
      { name: 'weight', type: 'VARCHAR(255)' },
      { name: 'dimensions', type: 'VARCHAR(255)' },
      { name: 'updatedAt', type: 'TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP' },
      { name: 'apparelType', type: 'VARCHAR(50)' }
    ];

    for (const col of merchColumns) {
      try {
        await prisma.$executeRawUnsafe(`
          ALTER TABLE "Merch" 
          ADD COLUMN IF NOT EXISTS "${col.name}" ${col.type}
        `);
        results.columnsAdded.push(`Merch.${col.name}`);
      } catch (error) {
        // Column might already exist
      }
    }

    // Update existing Game records to use enums
    const games = await prisma.$queryRawUnsafe(`
      SELECT id, "ageRating", players, "timeToPlay", category 
      FROM "Game"
    `) as any[];

    for (const game of games) {
      try {
        const updates: any = {};
        
        // Map old values to enums
        if (game.ageRating) {
          updates.ageRating = mapAgeRating(game.ageRating);
        }
        
        if (game.players) {
          updates.playerCount = mapPlayerCount(game.players);
          if (updates.playerCount === 'CUSTOM') {
            updates.playerCountCustom = game.players;
          }
        }
        
        if (game.timeToPlay) {
          updates.playTime = mapPlayTime(game.timeToPlay);
          if (updates.playTime === 'VARIABLE') {
            updates.playTimeCustom = game.timeToPlay;
          }
        }
        
        if (game.category) {
          updates.category = mapGameCategory(game.category);
        }

        // Update the game
        await prisma.game.update({
          where: { id: game.id },
          data: updates
        });
        
        results.gamesUpdated++;
      } catch (error) {
        results.errors.push(`Game ${game.id}: ${error}`);
      }
    }

    // Update existing Merch records to use enums
    const merchItems = await prisma.$queryRawUnsafe(`
      SELECT id, category 
      FROM "Merch"
    `) as any[];

    for (const merch of merchItems) {
      try {
        const updates: any = {};
        
        if (merch.category) {
          updates.category = mapMerchCategory(merch.category);
          
          // Set apparelType for apparel items
          if (updates.category === 'APPAREL') {
            // Try to guess from the name (you might need to adjust this logic)
            updates.apparelType = 'T_SHIRT'; // Default for now
          }
        }

        await prisma.merch.update({
          where: { id: merch.id },
          data: updates
        });
        
        results.merchUpdated++;
      } catch (error) {
        results.errors.push(`Merch ${merch.id}: ${error}`);
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Schema migration completed',
      results
    });
  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Migration failed' 
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'Use POST to run migration',
    description: 'This migration adds new fields and converts existing data to use enums' 
  });
}