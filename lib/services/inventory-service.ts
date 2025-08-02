import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { systemLogger } from './logger';

export class InventoryError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'InventoryError';
  }
}

export interface InventoryItem {
  type: 'game' | 'merch';
  id: number;
  quantity: number;
  size?: string; // For merch
}

export class InventoryService {
  /**
   * Reserve inventory for an order with proper locking
   * Uses database transactions to prevent race conditions
   */
  static async reserveInventory(items: InventoryItem[], orderId: string): Promise<void> {
    await prisma.$transaction(async (tx) => {
      for (const item of items) {
        if (item.type === 'game') {
          await this.reserveGameInventory(tx, item.id, item.quantity, orderId);
        } else {
          await this.reserveMerchInventory(tx, item.id, item.quantity, orderId, item.size);
        }
      }
    }, {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      maxWait: 5000,
      timeout: 10000,
    });
  }

  /**
   * Release reserved inventory (e.g., on order cancellation)
   */
  static async releaseInventory(items: InventoryItem[], orderId: string): Promise<void> {
    await prisma.$transaction(async (tx) => {
      for (const item of items) {
        if (item.type === 'game') {
          await this.releaseGameInventory(tx, item.id, item.quantity, orderId);
        } else {
          await this.releaseMerchInventory(tx, item.id, item.quantity, orderId, item.size);
        }
      }
    });
  }

  /**
   * Check if items are in stock without reserving
   */
  static async checkAvailability(items: InventoryItem[]): Promise<boolean> {
    try {
      for (const item of items) {
        const available = item.type === 'game' 
          ? await this.checkGameAvailability(item.id, item.quantity)
          : await this.checkMerchAvailability(item.id, item.quantity, item.size);
        
        if (!available) {
          return false;
        }
      }
      return true;
    } catch (error) {
      systemLogger.error('Error checking inventory availability', error as Error);
      return false;
    }
  }

  /**
   * Get current stock levels for items
   */
  static async getStockLevels(items: InventoryItem[]): Promise<Record<string, number>> {
    const levels: Record<string, number> = {};
    
    for (const item of items) {
      const key = item.type === 'game' 
        ? `game_${item.id}`
        : `merch_${item.id}_${item.size || 'default'}`;
      
      if (item.type === 'game') {
        const game = await prisma.game.findUnique({
          where: { id: item.id },
          select: { stock: true, reservedStock: true }
        });
        levels[key] = (game?.stock || 0) - (game?.reservedStock || 0);
      } else {
        const merch = await prisma.merch.findUnique({
          where: { id: item.id },
          select: { stock: true, reservedStock: true }
        });
        // TODO: Implement size-specific stock tracking
        levels[key] = (merch?.stock || 0) - (merch?.reservedStock || 0);
      }
    }
    
    return levels;
  }

  // Private helper methods
  private static async reserveGameInventory(
    tx: Prisma.TransactionClient,
    gameId: number,
    quantity: number,
    orderId: string
  ): Promise<void> {
    // Use raw SQL for atomic update with lock
    const result = await tx.$executeRaw`
      UPDATE "Game"
      SET "reservedStock" = "reservedStock" + ${quantity}
      WHERE id = ${gameId}
        AND ("stock" - "reservedStock") >= ${quantity}
    `;

    if (result === 0) {
      const game = await tx.game.findUnique({
        where: { id: gameId },
        select: { name: true, stock: true, reservedStock: true }
      });
      
      throw new InventoryError(
        `Insufficient stock for game: ${game?.name}. Available: ${(game?.stock || 0) - (game?.reservedStock || 0)}`,
        'INSUFFICIENT_STOCK'
      );
    }

    // Log inventory reservation
    systemLogger.info('Game inventory reserved', {
      gameId,
      quantity,
      orderId,
      action: 'inventory_reserved'
    });
  }

  private static async reserveMerchInventory(
    tx: Prisma.TransactionClient,
    merchId: number,
    quantity: number,
    orderId: string,
    size?: string
  ): Promise<void> {
    // Use raw SQL for atomic update with lock
    const result = await tx.$executeRaw`
      UPDATE "Merch"
      SET "reservedStock" = "reservedStock" + ${quantity}
      WHERE id = ${merchId}
        AND ("stock" - "reservedStock") >= ${quantity}
    `;

    if (result === 0) {
      const merch = await tx.merch.findUnique({
        where: { id: merchId },
        select: { name: true, stock: true, reservedStock: true }
      });
      
      throw new InventoryError(
        `Insufficient stock for merch: ${merch?.name}${size ? ` (Size: ${size})` : ''}. Available: ${(merch?.stock || 0) - (merch?.reservedStock || 0)}`,
        'INSUFFICIENT_STOCK'
      );
    }

    // Log inventory reservation
    systemLogger.info('Merch inventory reserved', {
      merchId,
      quantity,
      size,
      orderId,
      action: 'inventory_reserved'
    });
  }

  private static async releaseGameInventory(
    tx: Prisma.TransactionClient,
    gameId: number,
    quantity: number,
    orderId: string
  ): Promise<void> {
    await tx.$executeRaw`
      UPDATE "Game"
      SET "reservedStock" = GREATEST("reservedStock" - ${quantity}, 0)
      WHERE id = ${gameId}
    `;

    systemLogger.info('Game inventory released', {
      gameId,
      quantity,
      orderId,
      action: 'inventory_released'
    });
  }

  private static async releaseMerchInventory(
    tx: Prisma.TransactionClient,
    merchId: number,
    quantity: number,
    orderId: string,
    size?: string
  ): Promise<void> {
    await tx.$executeRaw`
      UPDATE "Merch"
      SET "reservedStock" = GREATEST("reservedStock" - ${quantity}, 0)
      WHERE id = ${merchId}
    `;

    systemLogger.info('Merch inventory released', {
      merchId,
      quantity,
      size,
      orderId,
      action: 'inventory_released'
    });
  }

  private static async checkGameAvailability(
    gameId: number,
    quantity: number
  ): Promise<boolean> {
    const game = await prisma.game.findUnique({
      where: { id: gameId },
      select: { stock: true, reservedStock: true }
    });
    
    if (!game) return false;
    return (game.stock - game.reservedStock) >= quantity;
  }

  private static async checkMerchAvailability(
    merchId: number,
    quantity: number,
    size?: string
  ): Promise<boolean> {
    const merch = await prisma.merch.findUnique({
      where: { id: merchId },
      select: { stock: true, reservedStock: true }
    });
    
    if (!merch) return false;
    // TODO: Implement size-specific stock checking
    return (merch.stock - merch.reservedStock) >= quantity;
  }

  /**
   * Commit reserved inventory (convert to actual sale)
   */
  static async commitInventory(items: InventoryItem[], orderId: string): Promise<void> {
    await prisma.$transaction(async (tx) => {
      for (const item of items) {
        if (item.type === 'game') {
          await tx.$executeRaw`
            UPDATE "Game"
            SET 
              "stock" = "stock" - ${item.quantity},
              "reservedStock" = GREATEST("reservedStock" - ${item.quantity}, 0)
            WHERE id = ${item.id}
          `;
        } else {
          await tx.$executeRaw`
            UPDATE "Merch"
            SET 
              "stock" = "stock" - ${item.quantity},
              "reservedStock" = GREATEST("reservedStock" - ${item.quantity}, 0)
            WHERE id = ${item.id}
          `;
        }
      }
    });

    systemLogger.info('Inventory committed', {
      orderId,
      itemCount: items.length,
      action: 'inventory_committed'
    });
  }

  /**
   * Get low stock items
   */
  static async getLowStockItems(threshold: number = 10): Promise<any[]> {
    const [games, merch] = await Promise.all([
      prisma.game.findMany({
        where: {
          stock: { lte: threshold }
        },
        select: {
          id: true,
          name: true,
          stock: true,
          reservedStock: true
        }
      }),
      prisma.merch.findMany({
        where: {
          stock: { lte: threshold }
        },
        select: {
          id: true,
          name: true,
          stock: true,
          reservedStock: true
        }
      })
    ]);

    return [
      ...games.map(g => ({ type: 'game', ...g })),
      ...merch.map(m => ({ type: 'merch', ...m }))
    ];
  }
}