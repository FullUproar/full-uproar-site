import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST() {
  try {
    // First, ensure the GameInventory table exists by trying to query it
    try {
      await prisma.$executeRaw`SELECT 1 FROM "GameInventory" LIMIT 1`;
      console.log('GameInventory table exists');
    } catch (error) {
      console.log('Creating GameInventory table...');
      // Create the table if it doesn't exist
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS "GameInventory" (
          "id" SERIAL PRIMARY KEY,
          "gameId" INTEGER NOT NULL UNIQUE,
          "quantity" INTEGER NOT NULL DEFAULT 0,
          "reserved" INTEGER NOT NULL DEFAULT 0,
          CONSTRAINT "GameInventory_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE CASCADE
        )
      `;
      
      // Create index
      await prisma.$executeRaw`
        CREATE INDEX IF NOT EXISTS "GameInventory_gameId_idx" ON "GameInventory"("gameId")
      `;
    }
    
    // Now migrate existing game stock data
    const games = await prisma.game.findMany();
    let created = 0;
    let updated = 0;
    let errors = 0;
    
    for (const game of games) {
      try {
        const existing = await prisma.gameInventory.findUnique({
          where: { gameId: game.id }
        });
        
        if (!existing) {
          await prisma.gameInventory.create({
            data: {
              gameId: game.id,
              quantity: game.stock || 0,
              reserved: 0
            }
          });
          created++;
        } else {
          // Optionally update if stock field has a different value
          if (existing.quantity === 0 && game.stock > 0) {
            await prisma.gameInventory.update({
              where: { gameId: game.id },
              data: { quantity: game.stock }
            });
            updated++;
          }
        }
      } catch (error) {
        console.error(`Error processing game ${game.id}:`, error);
        errors++;
      }
    }
    
    return NextResponse.json({
      success: true,
      message: 'Game inventory initialization completed',
      summary: {
        totalGames: games.length,
        created,
        updated,
        errors
      }
    });
  } catch (error) {
    console.error('Error initializing game inventory:', error);
    return NextResponse.json({ 
      error: 'Failed to initialize game inventory',
      details: String(error)
    }, { status: 500 });
  }
}