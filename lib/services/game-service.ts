import { BaseService } from './base-service';
import { Game, CreateGameRequest, UpdateGameRequest } from '@/lib/types';
import { prisma } from '@/lib/prisma';
import { generateSlug } from '@/lib/utils/validation';
import { ConflictError } from '@/lib/utils/errors';

class GameService extends BaseService<Game, CreateGameRequest, UpdateGameRequest> {
  constructor() {
    super(prisma, 'game');
  }

  /**
   * Create a new game with auto-generated slug
   */
  async create(data: CreateGameRequest): Promise<Game> {
    // Generate slug if not provided
    let slug = generateSlug(data.title);
    
    // Ensure slug is unique
    let suffix = 0;
    while (await this.exists({ slug })) {
      suffix++;
      slug = generateSlug(data.title, String(suffix));
    }

    // Handle additional images
    const { additionalImages, tags, ...gameData } = data;
    
    return this.transaction(async (tx) => {
      // Create the game
      const game = await tx.game.create({
        data: {
          ...gameData,
          slug,
          tags: tags ? JSON.stringify(tags) : null,
          images: additionalImages ? {
            create: additionalImages.map((img, index) => ({
              imageUrl: img.url,
              alt: img.alt || data.title,
              isPrimary: index === 0 && !data.imageUrl,
              sortOrder: index
            }))
          } : undefined
        },
        include: {
          images: true,
          inventory: true
        }
      });

      // Create inventory record
      await tx.gameInventory.create({
        data: {
          gameId: game.id,
          quantity: data.stock || 0,
          reserved: 0
        }
      });

      return game;
    });
  }

  /**
   * Update a game
   */
  async update(id: number, data: UpdateGameRequest): Promise<Game> {
    const { additionalImages, tags, ...gameData } = data;
    
    // If title is being updated, regenerate slug
    if (gameData.title) {
      const existingGame = await this.findById(id);
      if (existingGame.title !== gameData.title) {
        let slug = generateSlug(gameData.title);
        
        // Ensure new slug is unique (excluding current game)
        let suffix = 0;
        while (await this.exists({ slug, NOT: { id } })) {
          suffix++;
          slug = generateSlug(gameData.title, String(suffix));
        }
        
        (gameData as any).slug = slug;
      }
    }

    return super.update(id, {
      ...gameData,
      tags: tags ? JSON.stringify(tags) : undefined
    }, {
      images: true,
      inventory: true
    });
  }

  /**
   * Find featured games
   */
  async findFeatured(limit: number = 10): Promise<Game[]> {
    return this.findMany({
      where: { featured: true },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        images: {
          orderBy: [
            { isPrimary: 'desc' },
            { sortOrder: 'asc' }
          ]
        }
      }
    });
  }

  /**
   * Search games
   */
  async search(query: string, options?: {
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    isPreorder?: boolean;
  }): Promise<Game[]> {
    const where: any = {
      OR: [
        { title: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
        { tagline: { contains: query, mode: 'insensitive' } }
      ]
    };

    if (options?.category) {
      where.tags = { contains: options.category };
    }
    
    if (options?.minPrice !== undefined) {
      where.priceCents = { ...where.priceCents, gte: options.minPrice };
    }
    
    if (options?.maxPrice !== undefined) {
      where.priceCents = { ...where.priceCents, lte: options.maxPrice };
    }
    
    if (options?.isPreorder !== undefined) {
      where.isPreorder = options.isPreorder;
    }

    return this.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        images: true,
        inventory: true
      }
    });
  }

  /**
   * Update game stock
   */
  async updateStock(gameId: number, quantity: number): Promise<void> {
    await prisma.gameInventory.update({
      where: { gameId },
      data: { quantity }
    });
  }

  /**
   * Reserve stock for an order
   */
  async reserveStock(gameId: number, quantity: number): Promise<boolean> {
    const inventory = await prisma.gameInventory.findUnique({
      where: { gameId }
    });

    if (!inventory || inventory.quantity - inventory.reserved < quantity) {
      return false;
    }

    await prisma.gameInventory.update({
      where: { gameId },
      data: {
        reserved: inventory.reserved + quantity
      }
    });

    return true;
  }

  /**
   * Release reserved stock
   */
  async releaseStock(gameId: number, quantity: number): Promise<void> {
    await prisma.gameInventory.update({
      where: { gameId },
      data: {
        reserved: {
          decrement: quantity
        }
      }
    });
  }

  /**
   * Confirm reserved stock (when order is completed)
   */
  async confirmStock(gameId: number, quantity: number): Promise<void> {
    await prisma.gameInventory.update({
      where: { gameId },
      data: {
        quantity: { decrement: quantity },
        reserved: { decrement: quantity }
      }
    });
  }
}

// Export singleton instance
export const gameService = new GameService();