import { NextResponse } from 'next/server';
import { auth as getSession } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';
import { ADMIN_ROLES, HTTP_STATUS } from '@/lib/constants';

export type AdminCheckResult =
  | { authorized: true; userId: string; user: { id: string; role: string; email: string } }
  | { authorized: false; response: NextResponse };

/**
 * Verify user is authenticated AND has ADMIN role
 * Use at the start of admin API routes
 */
export async function requireAdmin(): Promise<AdminCheckResult> {
  const session = await getSession();

  if (!session?.user?.id) {
    return {
      authorized: false,
      response: NextResponse.json({ error: 'Unauthorized' }, { status: HTTP_STATUS.UNAUTHORIZED })
    };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, role: true, email: true }
  });

  if (!user || !ADMIN_ROLES.includes(user.role as typeof ADMIN_ROLES[number])) {
    return {
      authorized: false,
      response: NextResponse.json({ error: 'Admin access required' }, { status: HTTP_STATUS.FORBIDDEN })
    };
  }

  return { authorized: true, userId: user.id, user };
}

/**
 * Quick admin check - returns true if admin, false otherwise
 */
export async function isAdmin(): Promise<boolean> {
  const result = await requireAdmin();
  return result.authorized;
}
