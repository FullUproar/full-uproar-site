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
        const gameInventory = await prisma.gameInventory.findUnique({
          where: { gameId: item.id }
        });
        levels[key] = (gameInventory?.quantity || 0) - (gameInventory?.reserved || 0);
      } else {
        const merchInventory = await prisma.inventory.findFirst({
          where: { 
            merchId: item.id,
            size: item.size || null
          }
        });
        levels[key] = (merchInventory?.quantity || 0) - (merchInventory?.reserved || 0);
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
      UPDATE "GameInventory"
      SET "reserved" = "reserved" + ${quantity}
      WHERE "gameId" = ${gameId}
        AND ("quantity" - "reserved") >= ${quantity}
    `;

    if (result === 0) {
      const game = await tx.game.findUnique({
        where: { id: gameId },
        select: { title: true }
      });
      
      const gameInventory = await tx.gameInventory.findUnique({
        where: { gameId }
      });
      
      throw new InventoryError(
        `Insufficient stock for game: ${game?.title}. Available: ${(gameInventory?.quantity || 0) - (gameInventory?.reserved || 0)}`,
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
    const result = size 
      ? await tx.$executeRaw`
          UPDATE "Inventory"
          SET "reserved" = "reserved" + ${quantity}
          WHERE "merchId" = ${merchId}
            AND "size" = ${size}
            AND ("quantity" - "reserved") >= ${quantity}
        `
      : await tx.$executeRaw`
          UPDATE "Inventory"
          SET "reserved" = "reserved" + ${quantity}
          WHERE "merchId" = ${merchId}
            AND "size" IS NULL
            AND ("quantity" - "reserved") >= ${quantity}
        `;

    if (result === 0) {
      const merch = await tx.merch.findUnique({
        where: { id: merchId },
        select: { name: true }
      });
      
      const merchInventory = await tx.inventory.findFirst({
        where: { 
          merchId,
          size: size || null
        }
      });
      
      throw new InventoryError(
        `Insufficient stock for merch: ${merch?.name}${size ? ` (Size: ${size})` : ''}. Available: ${(merchInventory?.quantity || 0) - (merchInventory?.reserved || 0)}`,
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
      UPDATE "GameInventory"
      SET "reserved" = GREATEST("reserved" - ${quantity}, 0)
      WHERE "gameId" = ${gameId}
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
    const result = size
      ? await tx.$executeRaw`
          UPDATE "Inventory"
          SET "reserved" = GREATEST("reserved" - ${quantity}, 0)
          WHERE "merchId" = ${merchId}
            AND "size" = ${size}
        `
      : await tx.$executeRaw`
          UPDATE "Inventory"
          SET "reserved" = GREATEST("reserved" - ${quantity}, 0)
          WHERE "merchId" = ${merchId}
            AND "size" IS NULL
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
    const gameInventory = await prisma.gameInventory.findUnique({
      where: { gameId }
    });
    
    if (!gameInventory) return false;
    return (gameInventory.quantity - gameInventory.reserved) >= quantity;
  }

  private static async checkMerchAvailability(
    merchId: number,
    quantity: number,
    size?: string
  ): Promise<boolean> {
    const merchInventory = await prisma.inventory.findFirst({
      where: { 
        merchId,
        size: size || null
      }
    });
    
    if (!merchInventory) return false;
    return (merchInventory.quantity - merchInventory.reserved) >= quantity;
  }

  /**
   * Commit reserved inventory (convert to actual sale)
   */
  static async commitInventory(items: InventoryItem[], orderId: string): Promise<void> {
    await prisma.$transaction(async (tx) => {
      for (const item of items) {
        if (item.type === 'game') {
          await tx.$executeRaw`
            UPDATE "GameInventory"
            SET 
              "quantity" = "quantity" - ${item.quantity},
              "reserved" = GREATEST("reserved" - ${item.quantity}, 0)
            WHERE "gameId" = ${item.id}
          `;
        } else {
          const updateResult = item.size
            ? await tx.$executeRaw`
                UPDATE "Inventory"
                SET 
                  "quantity" = "quantity" - ${item.quantity},
                  "reserved" = GREATEST("reserved" - ${item.quantity}, 0)
                WHERE "merchId" = ${item.id}
                  AND "size" = ${item.size}
              `
            : await tx.$executeRaw`
                UPDATE "Inventory"
                SET 
                  "quantity" = "quantity" - ${item.quantity},
                  "reserved" = GREATEST("reserved" - ${item.quantity}, 0)
                WHERE "merchId" = ${item.id}
                  AND "size" IS NULL
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
    const [gameInventories, merchInventories] = await Promise.all([
      prisma.gameInventory.findMany({
        where: {
          quantity: { lte: threshold }
        },
        include: {
          game: {
            select: {
              id: true,
              title: true
            }
          }
        }
      }),
      prisma.inventory.findMany({
        where: {
          quantity: { lte: threshold }
        },
        include: {
          merch: {
            select: {
              id: true,
              name: true
            }
          }
        }
      })
    ]);

    return [
      ...gameInventories.map(gi => ({ 
        type: 'game', 
        id: gi.game.id,
        name: gi.game.title,
        stock: gi.quantity,
        reservedStock: gi.reserved
      })),
      ...merchInventories.map(mi => ({ 
        type: 'merch', 
        id: mi.merch.id,
        name: mi.merch.name,
        size: mi.size,
        stock: mi.quantity,
        reservedStock: mi.reserved
      }))
    ];
  }
}