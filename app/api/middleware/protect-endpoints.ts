import { NextRequest, NextResponse } from 'next/server';

// List of endpoints that should be protected in production
const PROTECTED_ENDPOINTS = [
  '/api/seed-data',
  '/api/db-init',
  '/api/init-db',
  '/api/debug',
  '/api/debug-db',
  '/api/create-enum-types',
  '/api/migrate-',
  '/api/fix-',
  '/api/init-',
  '/api/test-printify',
  '/api/admin/fix-connections',
];

export function isProtectedEndpoint(pathname: string): boolean {
  return PROTECTED_ENDPOINTS.some(endpoint => pathname.startsWith(endpoint));
}

export function protectEndpoint(request: NextRequest): NextResponse | null {
  // Allow in development
  if (process.env.NODE_ENV === 'development') {
    return null;
  }

  // Check for admin token in production
  const authHeader = request.headers.get('authorization');
  const adminToken = process.env.ADMIN_MIGRATION_TOKEN;

  if (!adminToken || authHeader !== `Bearer ${adminToken}`) {
    return NextResponse.json(
      { error: 'This endpoint is not available in production' },
      { status: 403 }
    );
  }

  return null;
}