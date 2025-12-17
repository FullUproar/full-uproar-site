import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { generateTOTPSecret, generateQRCode, encryptSecret } from '@/lib/auth/totp';
import { ADMIN_ROLES } from '@/lib/constants';
import { handleApiError, UnauthorizedError, ForbiddenError } from '@/lib/utils/errors';

// POST - Start 2FA setup (generate new secret)
export async function POST() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new UnauthorizedError();
    }

    if (!ADMIN_ROLES.includes(user.role as typeof ADMIN_ROLES[number])) {
      throw new ForbiddenError('Admin access required');
    }

    const { secret, uri } = generateTOTPSecret(user.email);
    const qrCode = await generateQRCode(uri);

    const encryptedSecret = encryptSecret(secret);
    await prisma.user.update({
      where: { id: user.id },
      data: {
        totpSecret: encryptedSecret,
        totpEnabled: false,
      },
    });

    return NextResponse.json({
      qrCode,
      secret,
      message: 'Scan the QR code with your authenticator app, then verify with a code',
    });
  } catch (error) {
    const { statusCode, body } = handleApiError(error);
    return NextResponse.json(body, { status: statusCode });
  }
}

// GET - Check if 2FA is set up
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new UnauthorizedError();
    }

    return NextResponse.json({
      totpEnabled: user.totpEnabled,
      totpVerifiedAt: user.totpVerifiedAt,
    });
  } catch (error) {
    const { statusCode, body } = handleApiError(error);
    return NextResponse.json(body, { status: statusCode });
  }
}
