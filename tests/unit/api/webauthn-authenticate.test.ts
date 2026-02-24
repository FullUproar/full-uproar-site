/**
 * @jest-environment node
 */

/**
 * WebAuthn Authentication API Tests
 *
 * Tests GET/POST /api/admin/webauthn/authenticate
 * - GET: generates authentication options for admin users
 * - POST: verifies response and elevates admin session
 */

// ─── Mocks ──────────────────────────────────────────────────────

jest.mock('@/lib/auth', () => ({
  getCurrentUser: jest.fn(),
}));

jest.mock('@/lib/prisma', () => ({
  prisma: {
    webAuthnCredential: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    user: {
      update: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

jest.mock('@/lib/auth/webauthn', () => ({
  generateAuthenticationOpts: jest.fn(),
  verifyAuthenticationResp: jest.fn(),
}));

jest.mock('@/lib/auth/totp', () => ({
  getElevationExpiry: jest.fn(),
}));

jest.mock('@/lib/constants', () => ({
  ADMIN_ROLES: ['ADMIN', 'SUPER_ADMIN', 'GOD'],
  HTTP_STATUS: {
    OK: 200,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    INTERNAL_SERVER_ERROR: 500,
  },
}));

// ─── Imports ────────────────────────────────────────────────────

import { NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateAuthenticationOpts, verifyAuthenticationResp } from '@/lib/auth/webauthn';
import { getElevationExpiry } from '@/lib/auth/totp';
import { GET, POST } from '@/app/api/admin/webauthn/authenticate/route';

const mockGetCurrentUser = getCurrentUser as jest.Mock;
const mockGenAuthOpts = generateAuthenticationOpts as jest.Mock;
const mockVerifyAuth = verifyAuthenticationResp as jest.Mock;
const mockGetElevationExpiry = getElevationExpiry as jest.Mock;

function createRequest(body: any): NextRequest {
  return new NextRequest('http://localhost:3000/api/admin/webauthn/authenticate', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  mockGetCurrentUser.mockResolvedValue({
    id: 'user-1',
    role: 'ADMIN',
    email: 'admin@fulluproar.com',
  });
});

// ═══════════════════════════════════════════════════════════════
// GET /api/admin/webauthn/authenticate
// ═══════════════════════════════════════════════════════════════

describe('GET /api/admin/webauthn/authenticate', () => {
  it('should return 401 when not authenticated', async () => {
    mockGetCurrentUser.mockResolvedValue(null);
    const response = await GET();
    expect(response.status).toBe(401);
  });

  it('should return 403 for non-admin users', async () => {
    mockGetCurrentUser.mockResolvedValue({ id: 'user-1', role: 'USER' });
    const response = await GET();
    expect(response.status).toBe(403);
  });

  it('should return 400 when no credentials registered', async () => {
    (prisma.webAuthnCredential.findMany as jest.Mock).mockResolvedValue([]);
    const response = await GET();
    const data = await response.json();
    expect(response.status).toBe(400);
    expect(data.error).toBe('No security keys registered');
  });

  it('should return authentication options when credentials exist', async () => {
    (prisma.webAuthnCredential.findMany as jest.Mock).mockResolvedValue([
      {
        credentialId: 'cred-1',
        publicKey: Buffer.from([1, 2, 3]),
        counter: BigInt(0),
        transports: ['usb'],
        deviceType: 'singleDevice',
        backedUp: false,
      },
    ]);

    const mockOptions = { challenge: 'test', rpId: 'localhost' };
    mockGenAuthOpts.mockResolvedValue(mockOptions);

    const response = await GET();
    const data = await response.json();
    expect(response.status).toBe(200);
    expect(data.challenge).toBe('test');
  });
});

// ═══════════════════════════════════════════════════════════════
// POST /api/admin/webauthn/authenticate
// ═══════════════════════════════════════════════════════════════

describe('POST /api/admin/webauthn/authenticate', () => {
  it('should return 401 when not authenticated', async () => {
    mockGetCurrentUser.mockResolvedValue(null);
    const response = await POST(createRequest({ response: {} }));
    expect(response.status).toBe(401);
  });

  it('should return 400 when response is missing', async () => {
    const response = await POST(createRequest({}));
    expect(response.status).toBe(400);
  });

  it('should return 400 when credential not found', async () => {
    (prisma.webAuthnCredential.findUnique as jest.Mock).mockResolvedValue(null);

    const response = await POST(createRequest({
      response: { id: 'unknown-cred' },
    }));
    const data = await response.json();
    expect(response.status).toBe(400);
    expect(data.error).toBe('Security key not recognized');
  });

  it('should return 400 when credential belongs to different user', async () => {
    (prisma.webAuthnCredential.findUnique as jest.Mock).mockResolvedValue({
      id: 'cred-db-1',
      userId: 'different-user',
      credentialId: 'cred-1',
      publicKey: Buffer.from([1, 2, 3]),
      counter: BigInt(0),
      transports: ['usb'],
      deviceType: 'singleDevice',
      backedUp: false,
    });

    const response = await POST(createRequest({
      response: { id: 'cred-1' },
    }));
    expect(response.status).toBe(400);
  });

  it('should elevate session on successful verification', async () => {
    const elevatedUntil = new Date(Date.now() + 3 * 60 * 60 * 1000);
    mockGetElevationExpiry.mockReturnValue(elevatedUntil);

    (prisma.webAuthnCredential.findUnique as jest.Mock).mockResolvedValue({
      id: 'cred-db-1',
      userId: 'user-1',
      credentialId: 'cred-1',
      publicKey: Buffer.from([1, 2, 3]),
      counter: BigInt(5),
      transports: ['usb'],
      deviceType: 'singleDevice',
      backedUp: false,
    });

    mockVerifyAuth.mockResolvedValue({
      verified: true,
      authenticationInfo: { newCounter: 6 },
    });

    (prisma.$transaction as jest.Mock).mockResolvedValue(undefined);

    const response = await POST(createRequest({
      response: { id: 'cred-1' },
    }));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.elevatedUntil).toBeDefined();
    expect(prisma.$transaction).toHaveBeenCalled();
  });

  it('should return 400 on failed verification', async () => {
    (prisma.webAuthnCredential.findUnique as jest.Mock).mockResolvedValue({
      id: 'cred-db-1',
      userId: 'user-1',
      credentialId: 'cred-1',
      publicKey: Buffer.from([1, 2, 3]),
      counter: BigInt(0),
      transports: ['usb'],
      deviceType: 'singleDevice',
      backedUp: false,
    });

    mockVerifyAuth.mockResolvedValue({ verified: false });

    const response = await POST(createRequest({
      response: { id: 'cred-1' },
    }));
    const data = await response.json();
    expect(response.status).toBe(400);
    expect(data.error).toBe('Authentication verification failed');
  });
});
