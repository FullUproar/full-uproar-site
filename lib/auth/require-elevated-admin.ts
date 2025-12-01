import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { isElevationValid } from '@/lib/auth/totp';

interface ElevatedAdminCheck {
  authorized: boolean;
  elevated: boolean;
  response?: NextResponse;
  user?: Awaited<ReturnType<typeof getCurrentUser>>;
}

/**
 * Check if user is an admin with elevated 2FA session
 * Use this for sensitive admin operations
 *
 * Returns:
 * - authorized: true if user is admin (regardless of elevation)
 * - elevated: true if admin session is elevated via 2FA
 * - response: error response if not authorized
 * - user: the user object if authorized
 */
export async function requireElevatedAdmin(): Promise<ElevatedAdminCheck> {
  const user = await getCurrentUser();

  // Check if user exists and is admin
  const adminRoles = ['ADMIN', 'SUPER_ADMIN', 'GOD'];
  if (!user || !adminRoles.includes(user.role)) {
    return {
      authorized: false,
      elevated: false,
      response: NextResponse.json({ error: 'Admin access required' }, { status: 403 }),
    };
  }

  // If 2FA is not enabled, allow access (but flag as not elevated)
  if (!user.totpEnabled) {
    return {
      authorized: true,
      elevated: false,
      user,
    };
  }

  // Check if elevation is valid
  const elevated = isElevationValid(user.adminElevatedUntil);

  if (!elevated) {
    return {
      authorized: true,
      elevated: false,
      response: NextResponse.json({
        error: 'Admin elevation required',
        requiresElevation: true,
      }, { status: 403 }),
    };
  }

  return {
    authorized: true,
    elevated: true,
    user,
  };
}

/**
 * Use this for read-only admin operations that don't need elevation
 */
export async function requireAdmin(): Promise<ElevatedAdminCheck> {
  const user = await getCurrentUser();

  const adminRoles = ['ADMIN', 'SUPER_ADMIN', 'GOD'];
  if (!user || !adminRoles.includes(user.role)) {
    return {
      authorized: false,
      elevated: false,
      response: NextResponse.json({ error: 'Admin access required' }, { status: 403 }),
    };
  }

  const elevated = user.totpEnabled ? isElevationValid(user.adminElevatedUntil) : false;

  return {
    authorized: true,
    elevated,
    user,
  };
}
