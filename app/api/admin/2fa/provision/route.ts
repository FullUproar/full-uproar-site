import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { generateTOTPSecret, generateQRCode, encryptSecret, isElevationValid } from '@/lib/auth/totp';
import { ADMIN_ROLES, HTTP_STATUS } from '@/lib/constants';
import { handleApiError, ValidationError, UnauthorizedError, ForbiddenError, NotFoundError } from '@/lib/utils/errors';

// POST - Generate 2FA setup for another admin (requires elevated admin)
export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      throw new UnauthorizedError();
    }

    if (!ADMIN_ROLES.includes(currentUser.role as typeof ADMIN_ROLES[number])) {
      throw new ForbiddenError('Admin access required');
    }

    if (!isElevationValid(currentUser.adminElevatedUntil)) {
      return NextResponse.json({
        error: 'Admin elevation required to provision 2FA',
        requiresElevation: true
      }, { status: HTTP_STATUS.FORBIDDEN });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      throw new ValidationError('Invalid request body');
    }

    const { userId } = body;
    if (!userId) {
      throw new ValidationError('User ID required');
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        totpEnabled: true,
        displayName: true,
      },
    });

    if (!targetUser) {
      throw new NotFoundError('User');
    }

    if (!targetUser.email.endsWith('@fulluproar.com')) {
      throw new ForbiddenError('Only @fulluproar.com email addresses can receive 2FA setup');
    }

    if (!ADMIN_ROLES.includes(targetUser.role as typeof ADMIN_ROLES[number])) {
      throw new ForbiddenError('Target user must have an admin role to set up 2FA');
    }

    if (targetUser.totpEnabled) {
      throw new ValidationError('User already has 2FA enabled. To reset, contact support.');
    }

    const { secret, uri } = generateTOTPSecret(targetUser.email);
    const qrCode = await generateQRCode(uri);

    const encryptedSecret = encryptSecret(secret);
    await prisma.user.update({
      where: { id: targetUser.id },
      data: {
        totpSecret: encryptedSecret,
        totpEnabled: false,
      },
    });

    return NextResponse.json({
      success: true,
      qrCode,
      secret,
      userEmail: targetUser.email,
      userName: targetUser.displayName || targetUser.email,
      message: 'Share this QR code securely with the user. It will only be shown once.',
    });
  } catch (error) {
    const { statusCode, body } = handleApiError(error);
    return NextResponse.json(body, { status: statusCode });
  }
}
