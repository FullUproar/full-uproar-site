import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { isElevationValid } from '@/lib/auth/totp';
import { prisma } from '@/lib/prisma';
import { ADMIN_ROLES, HTTP_STATUS } from '@/lib/constants';

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

  if (!user || !ADMIN_ROLES.includes(user.role as typeof ADMIN_ROLES[number])) {
    return {
      authorized: false,
      elevated: false,
      response: NextResponse.json({ error: 'Admin access required' }, { status: HTTP_STATUS.FORBIDDEN }),
    };
  }

  // Check if user has any 2FA method enabled
  const hasWebauthn = await prisma.webAuthnCredential.count({
    where: { userId: user.id },
  }) > 0;

  // If no 2FA method is enabled, allow access (but flag as not elevated)
  if (!user.totpEnabled && !hasWebauthn) {
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
      }, { status: HTTP_STATUS.FORBIDDEN }),
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
export async function requireAdminWithElevationStatus(): Promise<ElevatedAdminCheck> {
  const user = await getCurrentUser();

  if (!user || !ADMIN_ROLES.includes(user.role as typeof ADMIN_ROLES[number])) {
    return {
      authorized: false,
      elevated: false,
      response: NextResponse.json({ error: 'Admin access required' }, { status: HTTP_STATUS.FORBIDDEN }),
    };
  }

  const hasWebauthnCreds = await prisma.webAuthnCredential.count({
    where: { userId: user.id },
  }) > 0;
  const has2FA = user.totpEnabled || hasWebauthnCreds;
  const elevated = has2FA ? isElevationValid(user.adminElevatedUntil) : false;

  return {
    authorized: true,
    elevated,
    user,
  };
}
