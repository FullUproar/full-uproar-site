export const runtime = 'nodejs';

import { auth } from '@/lib/auth-config';
import { NextRequest, NextResponse } from 'next/server';
import { rateLimit } from '@/lib/middleware/rate-limit';
import { logger } from '@/lib/utils/logger';
import { isProtectedEndpoint, protectEndpoint } from './app/api/middleware/protect-endpoints';
import { addSecurityHeaders } from '@/lib/middleware/security-headers';

const protectedRoutes = [
  /^\/admin(.*)/,
  /^\/profile(.*)/,
  /^\/api\/admin(.*)/,
  /^\/api\/profile(.*)/,
  /^\/api\/users(.*)/,
];

export default auth(async (req) => {
  const path = req.nextUrl.pathname;

  // Protect admin and profile routes
  const isProtected = protectedRoutes.some(pattern => pattern.test(path));
  if (isProtected && !req.auth) {
    // For API routes, return 401 JSON
    if (path.startsWith('/api/')) {
      return addSecurityHeaders(
        NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      );
    }
    // For pages, redirect to sign-in
    return NextResponse.redirect(new URL('/sign-in', req.url));
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
    // Check if this is a protected test/migration endpoint
    if (isProtectedEndpoint(path)) {
      const protectionResponse = protectEndpoint(req);
      if (protectionResponse) {
        return addSecurityHeaders(protectionResponse);
      }
    }

    const rateLimitResponse = await rateLimit(req, rateLimitType);
    if (rateLimitResponse) {
      return addSecurityHeaders(rateLimitResponse);
    }

    // Log API requests
    logger.info(`API Request: ${req.method} ${path}`, {
      method: req.method,
      path,
      ip: req.headers.get('x-forwarded-for') || 'unknown',
      userAgent: req.headers.get('user-agent'),
    });
  }

  const response = NextResponse.next();
  response.headers.set('X-Middleware-Processed', 'true');
  return response;
});

export const config = {
  matcher: [
    '/((?!_next|static|favicon.ico).*)',
  ],
};
