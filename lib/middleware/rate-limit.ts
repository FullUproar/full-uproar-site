import { NextRequest, NextResponse } from 'next/server';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { config } from '@/lib/config';
import { logger } from '@/lib/utils/logger';

// Create Redis client - in production, use Upstash Redis
// For local dev, we'll use in-memory rate limiting
const redis = config.isProduction() && process.env.UPSTASH_REDIS_REST_URL
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : null;

// Rate limit configurations for different endpoints
export const rateLimiters = {
  // General API rate limit: 100 requests per minute
  api: redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(100, '1 m'),
        analytics: true,
        prefix: 'api',
      })
    : null,

  // Strict rate limit for auth endpoints: 5 requests per minute
  auth: redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(5, '1 m'),
        analytics: true,
        prefix: 'auth',
      })
    : null,

  // Checkout rate limit: 10 requests per minute
  checkout: redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(10, '1 m'),
        analytics: true,
        prefix: 'checkout',
      })
    : null,

  // Upload rate limit: 5 requests per 5 minutes
  upload: redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(5, '5 m'),
        analytics: true,
        prefix: 'upload',
      })
    : null,

  // Promo code validation: 10 requests per minute (prevent brute force)
  promo: redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(10, '1 m'),
        analytics: true,
        prefix: 'promo',
      })
    : null,
};

// In-memory rate limiting for development
const inMemoryLimits = new Map<string, { count: number; resetAt: number }>();

function inMemoryRateLimit(
  identifier: string,
  limit: number,
  windowMs: number
): { success: boolean; limit: number; remaining: number; reset: Date } {
  const now = Date.now();
  const key = identifier;
  const record = inMemoryLimits.get(key);

  if (!record || record.resetAt <= now) {
    inMemoryLimits.set(key, {
      count: 1,
      resetAt: now + windowMs,
    });
    return {
      success: true,
      limit,
      remaining: limit - 1,
      reset: new Date(now + windowMs),
    };
  }

  if (record.count >= limit) {
    return {
      success: false,
      limit,
      remaining: 0,
      reset: new Date(record.resetAt),
    };
  }

  record.count++;
  return {
    success: true,
    limit,
    remaining: limit - record.count,
    reset: new Date(record.resetAt),
  };
}

export async function rateLimit(
  request: NextRequest,
  type: keyof typeof rateLimiters = 'api'
): Promise<NextResponse | null> {
  // Skip rate limiting in test environment
  if (process.env.NODE_ENV === 'test') {
    return null;
  }

  const identifier = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    'anonymous';

  try {
    let rateLimitResult;

    if (rateLimiters[type]) {
      // Production: Use Upstash Redis
      const { success, limit, remaining, reset } = await rateLimiters[type]!.limit(identifier);
      rateLimitResult = { success, limit, remaining, reset: new Date(reset) };
    } else {
      // Development: Use in-memory rate limiting
      const limits = {
        api: { limit: 100, window: 60000 }, // 1 minute
        auth: { limit: 5, window: 60000 },
        checkout: { limit: 10, window: 60000 },
        upload: { limit: 5, window: 300000 }, // 5 minutes
        promo: { limit: 10, window: 60000 }, // Promo code validation
      };
      
      const { limit, window } = limits[type];
      rateLimitResult = inMemoryRateLimit(`${type}:${identifier}`, limit, window);
    }

    // Add rate limit headers to response
    const headers = {
      'X-RateLimit-Limit': rateLimitResult.limit.toString(),
      'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
      'X-RateLimit-Reset': rateLimitResult.reset.toISOString(),
    };

    if (!rateLimitResult.success) {
      logger.warn('Rate limit exceeded', {
        type,
        identifier,
        limit: rateLimitResult.limit,
      });

      return NextResponse.json(
        {
          error: 'Too many requests',
          message: 'Please slow down and try again later',
          retryAfter: rateLimitResult.reset,
        },
        {
          status: 429,
          headers: {
            ...headers,
            'Retry-After': Math.ceil((rateLimitResult.reset.getTime() - Date.now()) / 1000).toString(),
          },
        }
      );
    }

    // Rate limit passed - add headers to successful response
    return null;
  } catch (error) {
    logger.error('Rate limiting error', error);
    // Don't block requests if rate limiting fails
    return null;
  }
}

// Middleware helper to apply rate limiting
export function withRateLimit(
  handler: (req: NextRequest) => Promise<NextResponse>,
  type: keyof typeof rateLimiters = 'api'
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const rateLimitResponse = await rateLimit(req, type);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }
    return handler(req);
  };
}