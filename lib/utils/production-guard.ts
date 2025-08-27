import { NextRequest, NextResponse } from 'next/server';

// List of dangerous endpoints that should NEVER be accessible in production
const DANGEROUS_ENDPOINTS = [
  '/api/seed-data',
  '/api/test',
  '/api/test-order',
  '/api/test-printify',
  '/api/test-user-role',
  '/api/debug',
  '/api/debug-db',
  '/api/debug-user',
  '/api/auth/debug-comprehensive',
  '/api/db-init',
  '/api/init-db',
  '/api/init-game-inventory',
  '/api/create-enum-types',
  '/api/fix-game-category',
  '/api/run-migrations',
  '/api/migrate-',
  '/api/admin/seed-forum',
  '/api/admin/clear-test-data',
  '/api/admin/debug-permissions',
  '/api/admin/ensure-admin-user',
  '/api/admin/fix-admin-access',
  '/api/admin/fix-connections',
  '/api/admin/grant-admin',
  '/api/admin/test-mode',
  '/api/printify/debug',
  '/api/deployment-info',
  '/api/check-db-status'
];

// List of admin endpoints that require authentication
const ADMIN_ENDPOINTS = [
  '/api/admin/',
  '/api/analytics',
  '/api/orders',
  '/api/inventory',
  '/api/settings',
  '/api/upload'
];

/**
 * Check if the current environment is production
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production' && 
         process.env.VERCEL_ENV === 'production';
}

/**
 * Check if an endpoint is dangerous for production
 */
export function isDangerousEndpoint(pathname: string): boolean {
  return DANGEROUS_ENDPOINTS.some(endpoint => 
    pathname.startsWith(endpoint) || pathname.includes(endpoint)
  );
}

/**
 * Check if an endpoint requires admin authentication
 */
export function isAdminEndpoint(pathname: string): boolean {
  return ADMIN_ENDPOINTS.some(endpoint => 
    pathname.startsWith(endpoint)
  );
}

/**
 * Production guard for API routes
 * Returns an error response if the endpoint should not be accessible
 */
export function productionGuard(request: NextRequest): NextResponse | null {
  const pathname = request.nextUrl.pathname;
  
  // In production, block all dangerous endpoints
  if (isProduction() && isDangerousEndpoint(pathname)) {
    console.error(`[SECURITY] Blocked access to dangerous endpoint in production: ${pathname}`);
    
    return NextResponse.json(
      { 
        error: 'Not Found',
        message: 'This endpoint does not exist'
      },
      { status: 404 }
    );
  }
  
  // In any environment, log access to sensitive endpoints
  if (isDangerousEndpoint(pathname)) {
    console.warn(`[SECURITY] Access to sensitive endpoint: ${pathname} from IP: ${request.headers.get('x-forwarded-for') || 'unknown'}`);
  }
  
  return null;
}

/**
 * Environment-based feature flag
 */
export function isFeatureEnabled(feature: string): boolean {
  // In production, disable all debug features
  if (isProduction()) {
    const debugFeatures = ['debug', 'test', 'seed', 'migrate'];
    if (debugFeatures.some(f => feature.toLowerCase().includes(f))) {
      return false;
    }
  }
  
  // Check environment variables for feature flags
  const envVar = `FEATURE_${feature.toUpperCase().replace(/-/g, '_')}`;
  return process.env[envVar] === 'true';
}

/**
 * Get safe environment info (for client-side use)
 */
export function getSafeEnvironmentInfo() {
  return {
    environment: process.env.NODE_ENV,
    isProduction: isProduction(),
    // Never expose sensitive data
    version: process.env.NEXT_PUBLIC_VERSION || 'unknown',
    buildTime: process.env.NEXT_PUBLIC_BUILD_TIME || 'unknown'
  };
}