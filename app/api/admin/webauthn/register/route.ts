import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { requireElevatedAdmin } from '@/lib/auth/require-elevated-admin';
import { generateRegistrationOpts, verifyRegistrationResp } from '@/lib/auth/webauthn';
import { handleApiError, UnauthorizedError, ForbiddenError, ValidationError } from '@/lib/utils/errors';
import { ADMIN_ROLES, HTTP_STATUS } from '@/lib/constants';

// GET — Generate registration options
export async function GET() {
  try {
    const { authorized, elevated, user } = await requireElevatedAdmin();
    if (!authorized || !user) {
      throw new ForbiddenError('Admin access required');
    }
    if (!elevated) {
      throw new ForbiddenError('Admin elevation required to register security keys');
    }

    const existingCredentials = await prisma.webAuthnCredential.findMany({
      where: { userId: user.id },
      select: {
        credentialId: true,
        publicKey: true,
        counter: true,
        transports: true,
        deviceType: true,
        backedUp: true,
      },
    });

    const options = await generateRegistrationOpts(
      user.id,
      user.email,
      existingCredentials.map((c) => ({
        credentialId: c.credentialId,
        publicKey: Buffer.from(c.publicKey),
        counter: c.counter,
        transports: c.transports,
        deviceType: c.deviceType,
        backedUp: c.backedUp,
      })),
    );

    return NextResponse.json(options);
  } catch (error) {
    console.error('[WebAuthn Register GET]', error);
    const { statusCode, body } = handleApiError(error);
    return NextResponse.json(body, { status: statusCode });
  }
}

// POST — Verify registration response and store credential
export async function POST(request: NextRequest) {
  try {
    const { authorized, elevated, user } = await requireElevatedAdmin();
    if (!authorized || !user) {
      throw new ForbiddenError('Admin access required');
    }
    if (!elevated) {
      throw new ForbiddenError('Admin elevation required to register security keys');
    }

    let body;
    try {
      body = await request.json();
    } catch {
      throw new ValidationError('Invalid request body');
    }

    const { response, nickname } = body;
    if (!response) {
      throw new ValidationError('Missing registration response');
    }

    const verification = await verifyRegistrationResp(user.id, response);

    if (!verification.verified || !verification.registrationInfo) {
      return NextResponse.json(
        { error: 'Registration verification failed' },
        { status: HTTP_STATUS.BAD_REQUEST },
      );
    }

    const { credentialID, credentialPublicKey, counter, credentialDeviceType, credentialBackedUp } =
      verification.registrationInfo;

    // Store the credential
    const credential = await prisma.webAuthnCredential.create({
      data: {
        userId: user.id,
        nickname: nickname || null,
        credentialId: Buffer.from(credentialID).toString('base64url'),
        publicKey: Buffer.from(credentialPublicKey),
        counter: BigInt(counter),
        transports: response.response?.transports || [],
        deviceType: credentialDeviceType,
        backedUp: credentialBackedUp,
      },
    });

    return NextResponse.json({
      success: true,
      credentialId: credential.id,
      nickname: credential.nickname,
    });
  } catch (error) {
    console.error('[WebAuthn Register POST]', error);
    const { statusCode, body } = handleApiError(error);
    return NextResponse.json(body, { status: statusCode });
  }
}
