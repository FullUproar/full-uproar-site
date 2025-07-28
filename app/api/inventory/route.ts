import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const merchId = searchParams.get('merchId');
    
    const where: any = {};
    if (merchId) where.merchId = parseInt(merchId);
    
    const inventory = await prisma.inventory.findMany({
      where,
      include: {
        merch: true
      }
    });
    
    return NextResponse.json(inventory);
  } catch (error) {
    console.error('Error fetching inventory:', error);
    return NextResponse.json({ error: 'Failed to fetch inventory' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (!body.merchId) {
      return NextResponse.json({ error: 'Merch ID is required' }, { status: 400 });
    }
    
    // Update inventory for a specific merch item and size
    // First try to find existing inventory
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