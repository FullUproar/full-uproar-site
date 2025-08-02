import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth';
import { withErrorHandler } from '@/lib/utils/error-handler';

// In-memory test mode state (in production, use database or Redis)
let testModeEnabled = process.env.NODE_ENV === 'development';

export const GET = withErrorHandler(async (request: NextRequest) => {
  // Check admin permission
  await requirePermission('admin:access');
  
  return NextResponse.json({
    enabled: testModeEnabled,
    environment: process.env.NODE_ENV,
    stripeMode: process.env.STRIPE_SECRET_KEY?.startsWith('sk_test') ? 'test' : 'live'
  });
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  // Check super admin permission for changing test mode
  await requirePermission('admin:super');
  
  const { enabled } = await request.json();
  
  // Update test mode
  testModeEnabled = enabled;
  
  // In production, you would:
  // 1. Store this in database
  // 2. Notify all services
  // 3. Clear caches
  // 4. Log the change
  
  return NextResponse.json({
    enabled: testModeEnabled,
    message: `Test mode ${enabled ? 'enabled' : 'disabled'}`
  });
});

// Export for other modules to check test mode
export function isTestMode() {
  return testModeEnabled;
}