import { createApiHandler, createPaginationSchema } from '@/lib/api/base-handler';
import { gameService } from '@/lib/services/game-service';
import { successResponse, paginatedResponse } from '@/lib/utils/api-response';
import { createGameSchema, updateGameSchema } from '@/lib/utils/validation';
import { z } from 'zod';

// Query schema for GET requests
const getGamesQuerySchema = createPaginationSchema().extend({
  featured: z.enum(['true', 'false']).optional(),
  search: z.string().optional(),
  category: z.string().optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  isPreorder: z.enum(['true', 'false']).optional()
});

export const { GET, POST, PUT, DELETE } = createApiHandler({
  GET: {
    query: getGamesQuerySchema,
    handler: async ({ query }) => {
      const { page, limit, featured, search, ...filters } = query;

      // Featured games
      if (featured === 'true' && !search) {
        const games = await gameService.findFeatured(limit);
        return successResponse(games);
      }

      // Search
      if (search) {
        const games = await gameService.search(search, {
          ...filters,
          isPreorder: filters.isPreorder === 'true' ? true : filters.isPreorder === 'false' ? false : undefined
        });
        return successResponse(games);
      }

      // Paginated list
      const where: any = {};
      if (featured === 'true') where.featured = true;
      if (filters.category) where.tags = { contains: filters.category };
      if (filters.isPreorder !== undefined) where.isPreorder = filters.isPreorder === 'true';

      const result = await gameService.findManyPaginated(
        {
          where,
          orderBy: { createdAt: 'desc' },
          include: {
            images: {
              orderBy: [
                { isPrimary: 'desc' },
                { sortOrder: 'asc' }
              ]
            },
            inventory: true
          }
        },
        { page, limit }
      );

      return paginatedResponse(
        result.data,
        result.pagination.page,
        result.pagination.pageSize,
        result.pagination.total
      );
    }
  },

  POST: {
    body: createGameSchema,
    handler: async ({ body }) => {
      const game = await gameService.create(body);
      return successResponse(game, 'Game created successfully', 201);
    }
  },

  PUT: {
    query: z.object({ id: z.coerce.number() }),
    body: updateGameSchema,
    handler: async ({ query, body }) => {
      const game = await gameService.update(query.id, body);
      return successResponse(game, 'Game updated successfully');
    }
  },

  DELETE: {
    query: z.object({ id: z.coerce.number() }),
    handler: async ({ query }) => {
      await gameService.delete(query.id);
      return successResponse(null, 'Game deleted successfully');
    }
  }
});