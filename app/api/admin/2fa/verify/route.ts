import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { verifyTOTP, decryptSecret } from '@/lib/auth/totp';
import { ADMIN_ROLES } from '@/lib/constants';
import { handleApiError, ValidationError, UnauthorizedError, ForbiddenError } from '@/lib/utils/errors';

// POST - Verify TOTP code to complete setup
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new UnauthorizedError();
    }

    if (!ADMIN_ROLES.includes(user.role as typeof ADMIN_ROLES[number])) {
      throw new ForbiddenError('Admin access required');
    }

    if (!user.totpSecret) {
      throw new ValidationError('No 2FA setup in progress. Please start setup first.');
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

    const secret = decryptSecret(user.totpSecret);
    const isValid = verifyTOTP(secret, code);

    if (!isValid) {
      throw new ValidationError('Invalid verification code');
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        totpEnabled: true,
        totpVerifiedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: '2FA has been enabled successfully',
    });
  } catch (error) {
    const { statusCode, body } = handleApiError(error);
    return NextResponse.json(body, { status: statusCode });
  }
}
