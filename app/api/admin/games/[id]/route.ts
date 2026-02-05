import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth/require-admin';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const adminCheck = await requireAdmin();
    if (!adminCheck.authorized) return adminCheck.response;

    const { id } = await context.params;
    const gameId = parseInt(id);

    const game = await prisma.game.findUnique({
      where: { id: gameId },
      include: {
        images: true,
        inventory: true,
        reviews: true
      }
    });

    if (!game) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }

    return NextResponse.json(game);
  } catch (error) {
    console.error('Error fetching game:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch game',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const adminCheck = await requireAdmin();
    if (!adminCheck.authorized) return adminCheck.response;

    const { id } = await context.params;
    const gameId = parseInt(id);
    const body = await request.json();

    // Handle archive/unarchive action
    if (body.action === 'archive' || body.action === 'unarchive') {
      const game = await prisma.game.update({
        where: { id: gameId },
        data: { archived: body.action === 'archive' }
      });
      return NextResponse.json(game);
    }

    // Remove fields that shouldn't be updated directly
    const { id: _, createdAt, updatedAt, orderItems, images, inventory, reviews, ...updateData } = body;

    // Convert launchDate string to DateTime if provided
    if (updateData.launchDate) {
      updateData.launchDate = new Date(updateData.launchDate);
    }

    const updatedGame = await prisma.game.update({
      where: { id: gameId },
      data: updateData
    });

    return NextResponse.json(updatedGame);
  } catch (error) {
    console.error('Error updating game:', error);
    return NextResponse.json(
      {
        error: 'Failed to update game',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const adminCheck = await requireAdmin();
    if (!adminCheck.authorized) return adminCheck.response;

    const { id } = await context.params;
    const gameId = parseInt(id);

    // Delete in a transaction to handle all related records
    await prisma.$transaction(async (tx) => {
      // Delete related game inventory
      await tx.gameInventory.deleteMany({
        where: { gameId }
      });

      // Delete related images
      await tx.gameImage.deleteMany({
        where: { gameId }
      });

      // Delete related reviews
      await tx.review.deleteMany({
        where: { gameId }
      });

      // Check if there are any orders with this game
      const orderItems = await tx.orderItem.findMany({
        where: { gameId },
        include: { order: true }
      });

      if (orderItems.length > 0) {
        throw new Error('Cannot delete game that has been ordered. Consider archiving instead.');
      }

      // Finally delete the game
      await tx.game.delete({
        where: { id: gameId }
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting game:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to delete game',
        details: error instanceof Error ? error.message : undefined
      },
      { status: 500 }
    );
  }
}