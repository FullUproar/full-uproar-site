import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { rateLimit } from '@/lib/middleware/rate-limit';
import { logger } from '@/lib/utils/logger';

const isProtectedRoute = createRouteMatcher([
  '/admin(.*)',
  '/profile(.*)',
  '/api/admin(.*)',
  '/api/profile(.*)',
  '/api/users(.*)',
])

// Combine Clerk auth with rate limiting
export default clerkMiddleware(async (auth, request: NextRequest) => {
  const path = request.nextUrl.pathname;

  // Protect admin and profile routes
  if (isProtectedRoute(request)) {
    await auth.protect()
  }

  // Determine rate limit type based on path
  let rateLimitType: 'api' | 'auth' | 'checkout' | 'upload' = 'api';
  
  if (path.includes('/api/auth') || path.includes('/api/signin')) {
    rateLimitType = 'auth';
  } else if (path.includes('/api/checkout') || path.includes('/api/orders')) {
    rateLimitType = 'checkout';
  } else if (path.includes('/api/upload')) {
    rateLimitType = 'upload';
  }

  // Apply rate limiting for API routes
  if (path.startsWith('/api/')) {
    const rateLimitResponse = await rateLimit(request, rateLimitType);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    // Log API requests
    logger.info(`API Request: ${request.method} ${path}`, {
      method: request.method,
      path,
      ip: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent'),
    });
  }
})

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next
     * - static (Vercel static files)
     * - favicon
     * - public files
     */
    '/((?!_next|static|favicon.ico).*)',
  ],
};