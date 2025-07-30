import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret');
    
    // Simple security check
    if (secret !== 'migrate-game-inventory-2024') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get all games
    const games = await prisma.game.findMany();
    
    // Create GameInventory records for games that don't have them
    const results = await Promise.all(
      games.map(async (game) => {
        try {
          // Check if GameInventory already exists
          const existing = await prisma.gameInventory.findUnique({
            where: { gameId: game.id }
          });
          
          if (!existing) {
            // Create new GameInventory with quantity from the game's stock field
            const inventory = await prisma.gameInventory.create({
              data: {
                gameId: game.id,
                quantity: game.stock || 0,
                reserved: 0
              }
            });
            return { gameId: game.id, status: 'created', inventory };
          } else {
            return { gameId: game.id, status: 'exists' };
          }
        } catch (error) {
          return { gameId: game.id, status: 'error', error: String(error) };
        }
      })
    );
    
    const summary = {
      total: games.length,
      created: results.filter(r => r.status === 'created').length,
      existing: results.filter(r => r.status === 'exists').length,
      errors: results.filter(r => r.status === 'error').length
    };
    
    return NextResponse.json({
      success: true,
      message: 'Game inventory migration completed',
      summary,
      details: results
    });
  } catch (error) {
    console.error('Error migrating game inventory:', error);
    return NextResponse.json({ 
      error: 'Failed to migrate game inventory',
      details: String(error)
    }, { status: 500 });
  }
}