import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { verifyTOTP, decryptSecret, getElevationExpiry, isElevationValid } from '@/lib/auth/totp';
import { ADMIN_ROLES, HTTP_STATUS } from '@/lib/constants';
import { handleApiError, ValidationError, UnauthorizedError, ForbiddenError } from '@/lib/utils/errors';

// POST - Elevate admin session using 2FA code
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new UnauthorizedError();
    }

    // Only admins can elevate
    if (!ADMIN_ROLES.includes(user.role as typeof ADMIN_ROLES[number])) {
      throw new ForbiddenError('Admin access required');
    }

    // Check if 2FA is enabled
    if (!user.totpEnabled || !user.totpSecret) {
      return NextResponse.json({
        error: '2FA is not enabled. Please set up 2FA first.',
        code: 'TOTP_NOT_ENABLED',
        requiresSetup: true,
      }, { status: HTTP_STATUS.BAD_REQUEST });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      throw new ValidationError('Invalid request body');
    }

    const { code } = body;

    if (!code || typeof code !== 'string' || code.length !== 6) {
      throw new ValidationError('Invalid code format - must be 6 digits');
    }

    // Decrypt and verify
    let secret;
    try {
      secret = decryptSecret(user.totpSecret);
    } catch {
      console.error('Failed to decrypt 2FA secret for user:', user.id);
      return NextResponse.json({
        error: 'Failed to decrypt 2FA secret',
        code: 'DECRYPTION_ERROR',
      }, { status: HTTP_STATUS.INTERNAL_SERVER_ERROR });
    }

    const isValid = verifyTOTP(secret, code);

    if (!isValid) {
      throw new ValidationError('Invalid authentication code');
    }

    // Elevate session
    const elevatedUntil = getElevationExpiry();
    await prisma.user.update({
      where: { id: user.id },
      data: { adminElevatedUntil: elevatedUntil },
    });

    return NextResponse.json({
      success: true,
      elevatedUntil,
      message: 'Admin session elevated for 3 hours',
    });
  } catch (error) {
    const { statusCode, body } = handleApiError(error);
    return NextResponse.json(body, { status: statusCode });
  }
}

// GET - Check current elevation status
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new UnauthorizedError();
    }

    const isAdmin = ADMIN_ROLES.includes(user.role as typeof ADMIN_ROLES[number]);
    const isElevated = isElevationValid(user.adminElevatedUntil);

    return NextResponse.json({
      isAdmin,
      totpEnabled: user.totpEnabled,
      isElevated,
      elevatedUntil: user.adminElevatedUntil,
      requiresElevation: isAdmin && user.totpEnabled && !isElevated,
    });
  } catch (error) {
    const { statusCode, body } = handleApiError(error);
    return NextResponse.json(body, { status: statusCode });
  }
}

// DELETE - Manually end elevation (logout of admin mode)
export async function DELETE() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new UnauthorizedError();
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { adminElevatedUntil: null },
    });

    return NextResponse.json({
      success: true,
      message: 'Admin session de-elevated',
    });
  } catch (error) {
    const { statusCode, body } = handleApiError(error);
    return NextResponse.json(body, { status: statusCode });
  }
}
