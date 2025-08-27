import { NextRequest, NextResponse } from 'next/server';

// Comprehensive list of endpoints that should NEVER be accessible in production
const PROTECTED_ENDPOINTS = [
  // Data manipulation endpoints
  '/api/seed-data',
  '/api/db-init',
  '/api/init-db',
  '/api/init-game-inventory',
  '/api/create-enum-types',
  '/api/run-migrations',
  
  // Debug endpoints
  '/api/debug',
  '/api/debug-db',
  '/api/debug-user',
  '/api/auth/debug-comprehensive',
  '/api/deployment-info',
  '/api/check-db-status',
  
  // Test endpoints
  '/api/test',
  '/api/test-order',
  '/api/test-printify',
  '/api/test-user-role',
  
  // Migration endpoints (all)
  '/api/migrate-',
  
  // Fix endpoints (dangerous operations)
  '/api/fix-',
  '/api/admin/fix-admin-access',
  '/api/admin/fix-connections',
  
  // Admin dangerous operations
  '/api/admin/clear-test-data',
  '/api/admin/seed-forum',
  '/api/admin/debug-permissions',
  '/api/admin/ensure-admin-user',
  '/api/admin/grant-admin',
  '/api/admin/test-mode',
  
  // Printify debug
  '/api/printify/debug',
];

// Endpoints that require stricter validation even in development
const ALWAYS_PROTECTED = [
  '/api/admin/grant-admin',
  '/api/admin/clear-test-data',
  '/api/run-migrations',
];

export function isProtectedEndpoint(pathname: string): boolean {
  return PROTECTED_ENDPOINTS.some(endpoint => 
    pathname.startsWith(endpoint) || pathname.includes(endpoint)
  );
}

export function protectEndpoint(request: NextRequest): NextResponse | null {
  const pathname = request.nextUrl.pathname;
  const isProduction = process.env.NODE_ENV === 'production' || 
                       process.env.VERCEL_ENV === 'production';
  
  // Check if this endpoint should always be protected
  const alwaysProtected = ALWAYS_PROTECTED.some(endpoint => 
    pathname.startsWith(endpoint)
  );
  
  // In development, only protect the always-protected endpoints
  if (!isProduction && !alwaysProtected) {
    // Log the access for monitoring
    console.warn(`[DEV] Accessing protected endpoint: ${pathname}`);
    return null;
  }
  
  // In production or for always-protected endpoints, require authentication
  const authHeader = request.headers.get('authorization');
  const adminToken = process.env.ADMIN_MIGRATION_TOKEN;
  
  // For super-sensitive operations, require a specific token
  if (alwaysProtected) {
    if (!adminToken || authHeader !== `Bearer ${adminToken}`) {
      console.error(`[SECURITY] Unauthorized access attempt to ${pathname}`);
      return NextResponse.json(
        { 
          error: 'Unauthorized',
          message: 'This operation requires special authorization'
        },
        { status: 401 }
      );
    }
  }
  
  // In production, block all protected endpoints unless they have the token
  if (isProduction) {
    if (!adminToken || authHeader !== `Bearer ${adminToken}`) {
      console.error(`[SECURITY] Blocked production access to ${pathname}`);
      // Return 404 to not reveal the existence of these endpoints
      return NextResponse.json(
        { 
          error: 'Not Found',
          message: 'The requested endpoint does not exist'
        },
        { status: 404 }
      );
    }
  }
  
  return null;
}