import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireElevatedAdmin } from '@/lib/auth/require-elevated-admin';
import { handleApiError, ForbiddenError, ValidationError } from '@/lib/utils/errors';
import { HTTP_STATUS } from '@/lib/constants';

// GET — List user's registered credentials
export async function GET() {
  try {
    const { authorized, elevated, user } = await requireElevatedAdmin();
    if (!authorized || !user) {
      throw new ForbiddenError('Admin access required');
    }
    if (!elevated) {
      throw new ForbiddenError('Admin elevation required');
    }

    const credentials = await prisma.webAuthnCredential.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        nickname: true,
        createdAt: true,
        deviceType: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({ credentials });
  } catch (error) {
    const { statusCode, body } = handleApiError(error);
    return NextResponse.json(body, { status: statusCode });
  }
}

// DELETE — Remove a credential
export async function DELETE(request: NextRequest) {
  try {
    const { authorized, elevated, user } = await requireElevatedAdmin();
    if (!authorized || !user) {
      throw new ForbiddenError('Admin access required');
    }
    if (!elevated) {
      throw new ForbiddenError('Admin elevation required');
    }

    let body;
    try {
      body = await request.json();
    } catch {
      throw new ValidationError('Invalid request body');
    }

    const { credentialId } = body;
    if (!credentialId || typeof credentialId !== 'string') {
      throw new ValidationError('Missing credentialId');
    }

    // Verify the credential belongs to this user
    const credential = await prisma.webAuthnCredential.findUnique({
      where: { id: credentialId },
    });

    if (!credential || credential.userId !== user.id) {
      return NextResponse.json(
        { error: 'Credential not found' },
        { status: HTTP_STATUS.NOT_FOUND },
      );
    }

    // Prevent deleting last 2FA method
    const remainingKeys = await prisma.webAuthnCredential.count({
      where: { userId: user.id },
    });

    if (remainingKeys <= 1 && !user.totpEnabled) {
      return NextResponse.json(
        { error: 'Cannot delete your last security key while authenticator app is not enabled. You must have at least one 2FA method.' },
        { status: HTTP_STATUS.BAD_REQUEST },
      );
    }

    await prisma.webAuthnCredential.delete({
      where: { id: credentialId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const { statusCode, body } = handleApiError(error);
    return NextResponse.json(body, { status: statusCode });
  }
}

// PATCH — Rename a credential
export async function PATCH(request: NextRequest) {
  try {
    const { authorized, elevated, user } = await requireElevatedAdmin();
    if (!authorized || !user) {
      throw new ForbiddenError('Admin access required');
    }
    if (!elevated) {
      throw new ForbiddenError('Admin elevation required');
    }

    let body;
    try {
      body = await request.json();
    } catch {
      throw new ValidationError('Invalid request body');
    }

    const { credentialId, nickname } = body;
    if (!credentialId || typeof credentialId !== 'string') {
      throw new ValidationError('Missing credentialId');
    }
    if (typeof nickname !== 'string' || nickname.length > 50) {
      throw new ValidationError('Nickname must be a string of 50 characters or fewer');
    }

    // Verify the credential belongs to this user
    const credential = await prisma.webAuthnCredential.findUnique({
      where: { id: credentialId },
    });

    if (!credential || credential.userId !== user.id) {
      return NextResponse.json(
        { error: 'Credential not found' },
        { status: HTTP_STATUS.NOT_FOUND },
      );
    }

    await prisma.webAuthnCredential.update({
      where: { id: credentialId },
      data: { nickname: nickname || null },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const { statusCode, body } = handleApiError(error);
    return NextResponse.json(body, { status: statusCode });
  }
}
