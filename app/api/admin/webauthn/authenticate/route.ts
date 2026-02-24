import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { generateAuthenticationOpts, verifyAuthenticationResp } from '@/lib/auth/webauthn';
import { getElevationExpiry } from '@/lib/auth/totp';
import { handleApiError, UnauthorizedError, ForbiddenError, ValidationError } from '@/lib/utils/errors';
import { ADMIN_ROLES, HTTP_STATUS } from '@/lib/constants';

// GET — Generate authentication options
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new UnauthorizedError();
    }

    if (!ADMIN_ROLES.includes(user.role as typeof ADMIN_ROLES[number])) {
      throw new ForbiddenError('Admin access required');
    }

    const credentials = await prisma.webAuthnCredential.findMany({
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

    if (credentials.length === 0) {
      return NextResponse.json(
        { error: 'No security keys registered' },
        { status: HTTP_STATUS.BAD_REQUEST },
      );
    }

    const options = await generateAuthenticationOpts(
      user.id,
      credentials.map((c) => ({
        credentialId: c.credentialId,
        publicKey: Buffer.from(c.publicKey),
        counter: c.counter,
        transports: c.transports,
        deviceType: c.deviceType,
        backedUp: c.backedUp,
      })),
    );

    return NextResponse.json(options);
  } catch (error: any) {
    console.error('[WebAuthn Auth GET]', error);
    if (error instanceof UnauthorizedError || error instanceof ForbiddenError) {
      const { statusCode, body } = handleApiError(error);
      return NextResponse.json(body, { status: statusCode });
    }
    return NextResponse.json(
      { error: 'WebAuthn authentication options failed', detail: error?.message || String(error) },
      { status: 500 },
    );
  }
}

// POST — Verify authentication response and elevate admin session
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new UnauthorizedError();
    }

    if (!ADMIN_ROLES.includes(user.role as typeof ADMIN_ROLES[number])) {
      throw new ForbiddenError('Admin access required');
    }

    let body;
    try {
      body = await request.json();
    } catch {
      throw new ValidationError('Invalid request body');
    }

    const { response } = body;
    if (!response) {
      throw new ValidationError('Missing authentication response');
    }

    // Find the credential being used
    const credentialIdBase64url = response.id;
    const storedCredential = await prisma.webAuthnCredential.findUnique({
      where: { credentialId: credentialIdBase64url },
    });

    if (!storedCredential || storedCredential.userId !== user.id) {
      return NextResponse.json(
        { error: 'Security key not recognized' },
        { status: HTTP_STATUS.BAD_REQUEST },
      );
    }

    const verification = await verifyAuthenticationResp(
      user.id,
      response,
      {
        credentialId: storedCredential.credentialId,
        publicKey: Buffer.from(storedCredential.publicKey),
        counter: storedCredential.counter,
        transports: storedCredential.transports,
        deviceType: storedCredential.deviceType,
        backedUp: storedCredential.backedUp,
      },
    );

    if (!verification.verified) {
      return NextResponse.json(
        { error: 'Authentication verification failed' },
        { status: HTTP_STATUS.BAD_REQUEST },
      );
    }

    // Update counter for replay protection
    const newCounter = BigInt(verification.authenticationInfo.newCounter);
    const elevatedUntil = getElevationExpiry();

    await prisma.$transaction([
      prisma.webAuthnCredential.update({
        where: { id: storedCredential.id },
        data: { counter: newCounter },
      }),
      prisma.user.update({
        where: { id: user.id },
        data: { adminElevatedUntil: elevatedUntil },
      }),
    ]);

    return NextResponse.json({
      success: true,
      elevatedUntil,
      message: 'Admin session elevated for 3 hours',
    });
  } catch (error: any) {
    console.error('[WebAuthn Auth POST]', error);
    if (error instanceof UnauthorizedError || error instanceof ForbiddenError || error instanceof ValidationError) {
      const { statusCode, body } = handleApiError(error);
      return NextResponse.json(body, { status: statusCode });
    }
    return NextResponse.json(
      { error: 'WebAuthn authentication failed', detail: error?.message || String(error) },
      { status: 500 },
    );
  }
}
