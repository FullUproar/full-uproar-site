import { NextResponse } from 'next/server';
import { ApiResponse, PaginatedResponse, ApiError } from '@/lib/types';
import { handleApiError } from './errors';
import { logger } from './logger';

// Standard API response creators
export function successResponse<T>(
  data: T, 
  message?: string,
  statusCode: number = 200
): NextResponse<ApiResponse<T>> {
  return NextResponse.json({
    success: true,
    data,
    message,
    timestamp: new Date().toISOString()
  }, { status: statusCode });
}

export function errorResponse(
  error: unknown,
  requestContext?: { method?: string; path?: string }
): NextResponse<ApiError> {
  const { statusCode, body } = handleApiError(error);
  
  // Log the error
  if (requestContext) {
    logger.error(
      `API Error: ${requestContext.method || 'UNKNOWN'} ${requestContext.path || 'UNKNOWN'}`,
      error,
      { statusCode }
    );
  }
  
  return NextResponse.json(body, { status: statusCode });
}

export function paginatedResponse<T>(
  data: T[],
  page: number,
  pageSize: number,
  total: number,
  message?: string
): NextResponse<PaginatedResponse<T>> {
  const totalPages = Math.ceil(total / pageSize);
  
  return NextResponse.json({
    success: true,
    data,
    message,
    pagination: {
      page,
      pageSize,
      total,
      totalPages
    },
    timestamp: new Date().toISOString()
  });
}

// Response with custom headers
export function responseWithHeaders<T>(
  data: T,
  headers: HeadersInit,
  statusCode: number = 200
): NextResponse<T> {
  return NextResponse.json(data, {
    status: statusCode,
    headers
  });
}

// No content response
export function noContentResponse(): NextResponse {
  return new NextResponse(null, { status: 204 });
}

// Redirect response
export function redirectResponse(url: string, permanent: boolean = false): NextResponse {
  return NextResponse.redirect(url, permanent ? 301 : 302);
}

// Cache control headers
export const CacheHeaders = {
  noCache: {
    'Cache-Control': 'no-store, no-cache, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  },
  publicCache: (seconds: number) => ({
    'Cache-Control': `public, max-age=${seconds}, s-maxage=${seconds}`
  }),
  privateCache: (seconds: number) => ({
    'Cache-Control': `private, max-age=${seconds}`
  })
};

// CORS headers
export const CorsHeaders = {
  allowAll: {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  },
  allowOrigin: (origin: string) => ({
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true'
  })
};