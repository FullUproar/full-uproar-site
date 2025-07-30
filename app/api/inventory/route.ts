import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const merchId = searchParams.get('merchId');
    const gameId = searchParams.get('gameId');
    
    if (gameId) {
      // Fetch game inventory
      const gameInventory = await prisma.gameInventory.findUnique({
        where: { gameId: parseInt(gameId) },
        include: { game: true }
      });
      
      // If no inventory record exists, return default values
      if (!gameInventory) {
        return NextResponse.json([{
          id: 0,
          gameId: parseInt(gameId),
          quantity: 0,
          reserved: 0
        }]);
      }
      
      return NextResponse.json([gameInventory]);
    } else {
      // Fetch merch inventory
      const where: any = {};
      if (merchId) where.merchId = parseInt(merchId);
      
      const inventory = await prisma.inventory.findMany({
        where,
        include: {
          merch: true
        }
      });
      
      return NextResponse.json(inventory);
    }
  } catch (error) {
    console.error('Error fetching inventory:', error);
    return NextResponse.json({ error: 'Failed to fetch inventory' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (body.gameId) {
      // Update game inventory
      const existingInventory = await prisma.gameInventory.findUnique({
        where: { gameId: body.gameId }
      });

      if (existingInventory) {
        // Update existing
        const inventory = await prisma.gameInventory.update({
          where: { id: existingInventory.id },
          data: {
            quantity: body.quantity
          }
        });
        return NextResponse.json(inventory);
      } else {
        // Create new
        const inventory = await prisma.gameInventory.create({
          data: {
            gameId: body.gameId,
            quantity: body.quantity
          }
        });
        return NextResponse.json(inventory);
      }
    } else if (body.merchId) {
      // Update merch inventory
      const existingInventory = await prisma.inventory.findFirst({
        where: {
          merchId: body.merchId,
          size: body.size || null
        }
      });

      if (existingInventory) {
        // Update existing
        const inventory = await prisma.inventory.update({
          where: { id: existingInventory.id },
          data: {
            quantity: body.quantity
          }
        });
        return NextResponse.json(inventory);
      } else {
        // Create new
        const inventory = await prisma.inventory.create({
          data: {
            merchId: body.merchId,
            size: body.size || null,
            quantity: body.quantity
          }
        });
        return NextResponse.json(inventory);
      }
    } else {
      return NextResponse.json({ error: 'Game ID or Merch ID is required' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error updating inventory:', error);
    return NextResponse.json({ error: 'Failed to update inventory' }, { status: 500 });
  }
}

// Batch update for multiple inventory items
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (!Array.isArray(body.updates)) {
      return NextResponse.json({ error: 'Updates array is required' }, { status: 400 });
    }
    
    const results = await Promise.all(
      body.updates.map(async (update: any) => {
        try {
          // First try to find existing inventory
          const existingInventory = await prisma.inventory.findFirst({
            where: {
              merchId: update.merchId,
              size: update.size || null
            }
          });

          if (existingInventory) {
            // Update existing
            return await prisma.inventory.update({
              where: { id: existingInventory.id },
              data: {
                quantity: update.quantity
              }
            });
          } else {
            // Create new
            return await prisma.inventory.create({
              data: {
                merchId: update.merchId,
                size: update.size || null,
                quantity: update.quantity
              }
            });
          }
        } catch (err) {
          console.error('Error updating inventory item:', err);
          return { error: true, merchId: update.merchId, size: update.size };
        }
      })
    );
    
    return NextResponse.json({ success: true, results });
  } catch (error) {
    console.error('Error batch updating inventory:', error);
    return NextResponse.json({ error: 'Failed to update inventory' }, { status: 500 });
  }
}