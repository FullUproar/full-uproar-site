import { Redis } from '@upstash/redis';
import { config } from '@/lib/config';
import { logger } from '@/lib/utils/logger';

// Cache key prefixes
export const CacheKeys = {
  GAME: 'game:',
  GAMES_LIST: 'games:list:',
  MERCH: 'merch:',
  MERCH_LIST: 'merch:list:',
  FEATURED_GAMES: 'featured:games',
  FEATURED_MERCH: 'featured:merch',
  INVENTORY: 'inventory:',
  SETTINGS: 'settings:',
} as const;

// Cache durations in seconds
export const CacheDurations = {
  SHORT: 60, // 1 minute
  MEDIUM: 300, // 5 minutes
  LONG: 3600, // 1 hour
  DAY: 86400, // 1 day
} as const;

class CacheManager {
  private redis: Redis | null = null;
  private memoryCache = new Map<string, { value: any; expiresAt: number }>();

  constructor() {
    // Initialize Redis if in production
    if (config.isProduction() && process.env.UPSTASH_REDIS_REST_URL) {
      this.redis = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN!,
      });
    }
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      if (this.redis) {
        const value = await this.redis.get(key);
        return value as T;
      } else {
        // Use in-memory cache for development
        const cached = this.memoryCache.get(key);
        if (cached && cached.expiresAt > Date.now()) {
          return cached.value;
        }
        this.memoryCache.delete(key);
        return null;
      }
    } catch (error) {
      logger.error('Cache get error', error, { key });
      return null;
    }
  }

  async set(key: string, value: any, ttlSeconds: number = CacheDurations.MEDIUM): Promise<void> {
    try {
      if (this.redis) {
        await this.redis.set(key, value, { ex: ttlSeconds });
      } else {
        // Use in-memory cache for development
        this.memoryCache.set(key, {
          value,
          expiresAt: Date.now() + (ttlSeconds * 1000),
        });
        // Clean up expired entries periodically
        this.cleanupMemoryCache();
      }
    } catch (error) {
      logger.error('Cache set error', error, { key });
    }
  }

  async delete(key: string): Promise<void> {
    try {
      if (this.redis) {
        await this.redis.del(key);
      } else {
        this.memoryCache.delete(key);
      }
    } catch (error) {
      logger.error('Cache delete error', error, { key });
    }
  }

  async deletePattern(pattern: string): Promise<void> {
    try {
      if (this.redis) {
        // Note: This is expensive in production, use sparingly
        const keys = await this.redis.keys(pattern);
        if (keys.length > 0) {
          await this.redis.del(...keys);
        }
      } else {
        // For in-memory cache
        const keysToDelete: string[] = [];
        for (const key of this.memoryCache.keys()) {
          if (key.includes(pattern.replace('*', ''))) {
            keysToDelete.push(key);
          }
        }
        keysToDelete.forEach(key => this.memoryCache.delete(key));
      }
    } catch (error) {
      logger.error('Cache delete pattern error', error, { pattern });
    }
  }

  private cleanupMemoryCache() {
    const now = Date.now();
    for (const [key, cached] of this.memoryCache.entries()) {
      if (cached.expiresAt <= now) {
        this.memoryCache.delete(key);
      }
    }
  }

  // Helper methods for common patterns
  async remember<T>(
    key: string,
    factory: () => Promise<T>,
    ttlSeconds: number = CacheDurations.MEDIUM
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const value = await factory();
    await this.set(key, value, ttlSeconds);
    return value;
  }

  // Invalidation helpers
  async invalidateGame(gameId: number | string) {
    await this.delete(`${CacheKeys.GAME}${gameId}`);
    await this.deletePattern(`${CacheKeys.GAMES_LIST}*`);
    await this.delete(CacheKeys.FEATURED_GAMES);
  }

  async invalidateMerch(merchId: number | string) {
    await this.delete(`${CacheKeys.MERCH}${merchId}`);
    await this.deletePattern(`${CacheKeys.MERCH_LIST}*`);
    await this.delete(CacheKeys.FEATURED_MERCH);
  }

  async invalidateInventory(productId: number | string, productType: 'game' | 'merch') {
    await this.delete(`${CacheKeys.INVENTORY}${productType}:${productId}`);
  }
}

// Export singleton instance
export const cache = new CacheManager();