import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from '@simplewebauthn/server';
import type {
  RegistrationResponseJSON,
  AuthenticationResponseJSON,
  AuthenticatorTransportFuture,
} from '@simplewebauthn/types';
import { prisma } from '@/lib/prisma';

// ─── Config ──────────────────────────────────────────────────────

const RP_NAME = 'Full Uproar Admin';
const RP_ID = process.env.WEBAUTHN_RP_ID || 'localhost';

// Accept both www and non-www origins (browser may send either)
function getExpectedOrigins(): string[] {
  const origin = process.env.WEBAUTHN_ORIGIN || 'http://localhost:3000';
  const origins = [origin];
  if (origin.includes('://www.')) {
    origins.push(origin.replace('://www.', '://'));
  } else if (origin.includes('://') && !origin.includes('://localhost')) {
    const withWww = origin.replace('://', '://www.');
    origins.push(withWww);
  }
  return origins;
}
const EXPECTED_ORIGINS = getExpectedOrigins();

// ─── Challenge Store (DB-backed for serverless) ─────────────────
// Stored in PostgreSQL so challenges survive across serverless instances.

const CHALLENGE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export async function storeChallenge(userId: string, challenge: string) {
  const expiresAt = new Date(Date.now() + CHALLENGE_TTL_MS);
  await prisma.webAuthnChallenge.upsert({
    where: { userId },
    update: { challenge, expiresAt },
    create: { userId, challenge, expiresAt },
  });
}

export async function getAndDeleteChallenge(userId: string): Promise<string | null> {
  const entry = await prisma.webAuthnChallenge.findUnique({
    where: { userId },
  });
  if (!entry) return null;

  // Delete it (one-time use)
  await prisma.webAuthnChallenge.delete({ where: { userId } });

  // Check expiry
  if (entry.expiresAt < new Date()) return null;

  return entry.challenge;
}

// ─── Credential types ────────────────────────────────────────────

export interface StoredCredential {
  credentialId: string; // base64url
  publicKey: Buffer;
  counter: bigint;
  transports: string[];
  deviceType: string | null;
  backedUp: boolean;
}

// ─── Registration ────────────────────────────────────────────────

export async function generateRegistrationOpts(
  userId: string,
  userEmail: string,
  existingCredentials: StoredCredential[],
) {
  const options = await generateRegistrationOptions({
    rpName: RP_NAME,
    rpID: RP_ID,
    userID: Buffer.from(userId).toString('base64url'),
    userName: userEmail,
    attestationType: 'none',
    excludeCredentials: existingCredentials.map((cred) => ({
      id: Buffer.from(cred.credentialId, 'base64url'),
      type: 'public-key' as const,
      transports: cred.transports as AuthenticatorTransportFuture[],
    })),
    authenticatorSelection: {
      authenticatorAttachment: 'cross-platform',
      residentKey: 'discouraged',
      userVerification: 'discouraged',
    },
  });

  await storeChallenge(userId, options.challenge);
  return options;
}

export async function verifyRegistrationResp(
  userId: string,
  response: RegistrationResponseJSON,
) {
  const expectedChallenge = await getAndDeleteChallenge(userId);
  if (!expectedChallenge) {
    throw new Error('Challenge expired or not found');
  }

  const verification = await verifyRegistrationResponse({
    response,
    expectedChallenge,
    expectedOrigin: EXPECTED_ORIGINS,
    expectedRPID: RP_ID,
    requireUserVerification: false,
  });

  return verification;
}

// ─── Authentication ──────────────────────────────────────────────

export async function generateAuthenticationOpts(
  userId: string,
  credentials: StoredCredential[],
) {
  const options = await generateAuthenticationOptions({
    rpID: RP_ID,
    userVerification: 'discouraged',
    allowCredentials: credentials.map((cred) => ({
      id: Buffer.from(cred.credentialId, 'base64url'),
      type: 'public-key' as const,
      transports: (cred.transports.length > 0 ? cred.transports : ['usb']) as AuthenticatorTransportFuture[],
    })),
  });

  await storeChallenge(userId, options.challenge);
  return options;
}

export async function verifyAuthenticationResp(
  userId: string,
  response: AuthenticationResponseJSON,
  credential: StoredCredential,
) {
  const expectedChallenge = await getAndDeleteChallenge(userId);
  if (!expectedChallenge) {
    throw new Error('Challenge expired or not found');
  }

  const verification = await verifyAuthenticationResponse({
    response,
    expectedChallenge,
    expectedOrigin: EXPECTED_ORIGINS,
    expectedRPID: RP_ID,
    requireUserVerification: false,
    authenticator: {
      credentialID: Buffer.from(credential.credentialId, 'base64url'),
      credentialPublicKey: new Uint8Array(credential.publicKey),
      counter: Number(credential.counter),
      transports: credential.transports as AuthenticatorTransportFuture[],
    },
  });

  return verification;
}
