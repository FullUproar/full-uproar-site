import { NextRequest, NextResponse } from 'next/server';
import { errorResponse, successResponse } from '@/lib/utils/api-response';
import { logger, trackApiRequest } from '@/lib/utils/logger';
import { validateRequest } from '@/lib/utils/validation';
import { z } from 'zod';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

interface RouteHandler<TParams = any, TBody = any, TQuery = any> {
  params?: z.ZodSchema<TParams>;
  body?: z.ZodSchema<TBody>;
  query?: z.ZodSchema<TQuery>;
  handler: (context: {
    params: TParams;
    body: TBody;
    query: TQuery;
    request: NextRequest;
  }) => Promise<NextResponse>;
}

type RouteHandlers = Partial<Record<HttpMethod, RouteHandler>>;

/**
 * Create a type-safe API route handler with built-in validation, error handling, and logging
 */
export function createApiHandler(handlers: RouteHandlers) {
  return async function handler(
    request: NextRequest,
    context?: { params?: any }
  ): Promise<NextResponse> {
    const tracker = trackApiRequest(request);
    const method = request.method as HttpMethod;
    const routeHandler = handlers[method];

    try {
      // Method not allowed
      if (!routeHandler) {
        const allowed = Object.keys(handlers).join(', ');
        tracker.logResponse(405);
        return NextResponse.json(
          { error: 'Method not allowed', allowed },
          { 
            status: 405,
            headers: { 'Allow': allowed }
          }
        );
      }

      // Parse and validate request data
      const url = new URL(request.url);
      const searchParams = Object.fromEntries(url.searchParams);
      
      let body: any = undefined;
      if (['POST', 'PUT', 'PATCH'].includes(method) && request.body) {
        try {
          body = await request.json();
        } catch {
          // If JSON parsing fails, body remains undefined
        }
      }

      // Validate inputs
      const validatedParams = routeHandler.params 
        ? await validateRequest(context?.params || {}, routeHandler.params)
        : context?.params || {};
        
      const validatedBody = routeHandler.body 
        ? await validateRequest(body, routeHandler.body)
        : body;
        
      const validatedQuery = routeHandler.query 
        ? await validateRequest(searchParams, routeHandler.query)
        : searchParams;

      // Execute handler
      const response = await routeHandler.handler({
        params: validatedParams,
        body: validatedBody,
        query: validatedQuery,
        request
      });

      // Log successful response
      tracker.logResponse(response.status);
      return response;

    } catch (error) {
      // Log and return error response
      const errorResp = errorResponse(error, {
        method,
        path: request.url
      });
      tracker.logResponse(errorResp.status);
      return errorResp;
    }
  };
}

/**
 * Higher-order function to add authentication to a handler
 */
export function withAuth<TContext extends { userId?: string }>(
  handler: (context: TContext) => Promise<NextResponse>
) {
  return async (context: TContext): Promise<NextResponse> => {
    // Here you would implement your auth check
    // For now, we'll just pass through
    // In a real app, you'd check JWT, session, etc.
    
    // Example:
    // const token = context.request.headers.get('authorization');
    // if (!token) {
    //   throw new UnauthorizedError('No authorization token provided');
    // }
    // const userId = await verifyToken(token);
    // context.userId = userId;

    return handler(context);
  };
}

/**
 * Higher-order function to add rate limiting to a handler
 */
export function withRateLimit(
  limit: number,
  windowMs: number = 60000 // 1 minute default
) {
  // In a real implementation, you'd use Redis or similar
  const attempts = new Map<string, { count: number; resetAt: number }>();

  return function<TContext extends { request: NextRequest }>(
    handler: (context: TContext) => Promise<NextResponse>
  ) {
    return async (context: TContext): Promise<NextResponse> => {
      const ip = context.request.headers.get('x-forwarded-for') || 'unknown';
      const now = Date.now();
      
      const record = attempts.get(ip);
      if (record && record.resetAt > now) {
        if (record.count >= limit) {
          return NextResponse.json(
            { error: 'Too many requests' },
            { 
              status: 429,
              headers: {
                'Retry-After': String(Math.ceil((record.resetAt - now) / 1000))
              }
            }
          );
        }
        record.count++;
      } else {
        attempts.set(ip, { count: 1, resetAt: now + windowMs });
      }

      return handler(context);
    };
  };
}

/**
 * Helper to create paginated query schema
 */
export function createPaginationSchema(defaults?: { page?: number; limit?: number }) {
  return z.object({
    page: z.coerce.number().int().min(1).default(defaults?.page || 1),
    limit: z.coerce.number().int().min(1).max(100).default(defaults?.limit || 20)
  });
}