/**
 * @jest-environment node
 */

/**
 * WebAuthn Credentials Management API Tests
 *
 * Tests GET/DELETE/PATCH /api/admin/webauthn/credentials
 * - GET: lists registered credentials
 * - DELETE: removes a credential (prevents deleting last 2FA method)
 * - PATCH: renames a credential
 */

// ─── Mocks ──────────────────────────────────────────────────────

jest.mock('@/lib/auth', () => ({
  getCurrentUser: jest.fn(),
}));

jest.mock('@/lib/auth/totp', () => ({
  isElevationValid: jest.fn(),
}));

jest.mock('@/lib/prisma', () => ({
  prisma: {
    webAuthnCredential: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
      delete: jest.fn(),
      update: jest.fn(),
    },
    user: { findUnique: jest.fn() },
  },
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
import { isElevationValid } from '@/lib/auth/totp';
import { prisma } from '@/lib/prisma';
import { GET, DELETE, PATCH } from '@/app/api/admin/webauthn/credentials/route';

const mockGetCurrentUser = getCurrentUser as jest.Mock;
const mockIsElevationValid = isElevationValid as jest.Mock;

function createRequest(body: any): NextRequest {
  return new NextRequest('http://localhost:3000/api/admin/webauthn/credentials', {
    method: 'DELETE',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

function makeElevatedAdmin() {
  mockGetCurrentUser.mockResolvedValue({
    id: 'user-1',
    role: 'ADMIN',
    email: 'admin@fulluproar.com',
    totpEnabled: true,
    adminElevatedUntil: new Date(Date.now() + 60000),
  });
  mockIsElevationValid.mockReturnValue(true);
  // For require-elevated-admin's WebAuthn check
  (prisma.webAuthnCredential.count as jest.Mock).mockResolvedValue(1);
}

beforeEach(() => {
  jest.clearAllMocks();
  makeElevatedAdmin();
});

// ═══════════════════════════════════════════════════════════════
// GET /api/admin/webauthn/credentials
// ═══════════════════════════════════════════════════════════════

describe('GET /api/admin/webauthn/credentials', () => {
  it('should return list of credentials', async () => {
    (prisma.webAuthnCredential.findMany as jest.Mock).mockResolvedValue([
      { id: 'cred-1', nickname: 'Home YubiKey', createdAt: new Date(), deviceType: 'singleDevice' },
      { id: 'cred-2', nickname: 'Work YubiKey', createdAt: new Date(), deviceType: 'singleDevice' },
    ]);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.credentials).toHaveLength(2);
    expect(data.credentials[0].nickname).toBe('Home YubiKey');
  });

  it('should return 403 when not elevated', async () => {
    mockIsElevationValid.mockReturnValue(false);

    const response = await GET();
    expect(response.status).toBe(403);
  });
});

// ═══════════════════════════════════════════════════════════════
// DELETE /api/admin/webauthn/credentials
// ═══════════════════════════════════════════════════════════════

describe('DELETE /api/admin/webauthn/credentials', () => {
  it('should delete a credential', async () => {
    (prisma.webAuthnCredential.findUnique as jest.Mock).mockResolvedValue({
      id: 'cred-1',
      userId: 'user-1',
    });
    // 2 keys remaining → safe to delete
    (prisma.webAuthnCredential.count as jest.Mock).mockResolvedValue(2);
    (prisma.webAuthnCredential.delete as jest.Mock).mockResolvedValue({});

    const response = await DELETE(createRequest({ credentialId: 'cred-1' }));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(prisma.webAuthnCredential.delete).toHaveBeenCalledWith({
      where: { id: 'cred-1' },
    });
  });

  it('should return 404 when credential not found', async () => {
    (prisma.webAuthnCredential.findUnique as jest.Mock).mockResolvedValue(null);

    const response = await DELETE(createRequest({ credentialId: 'nonexistent' }));
    expect(response.status).toBe(404);
  });

  it('should return 404 when credential belongs to different user', async () => {
    (prisma.webAuthnCredential.findUnique as jest.Mock).mockResolvedValue({
      id: 'cred-1',
      userId: 'different-user',
    });

    const response = await DELETE(createRequest({ credentialId: 'cred-1' }));
    expect(response.status).toBe(404);
  });

  it('should prevent deleting last key when TOTP is disabled', async () => {
    mockGetCurrentUser.mockResolvedValue({
      id: 'user-1',
      role: 'ADMIN',
      totpEnabled: false,
      adminElevatedUntil: new Date(Date.now() + 60000),
    });

    (prisma.webAuthnCredential.findUnique as jest.Mock).mockResolvedValue({
      id: 'cred-1',
      userId: 'user-1',
    });
    // Only 1 key remaining
    (prisma.webAuthnCredential.count as jest.Mock).mockResolvedValue(1);

    const response = await DELETE(createRequest({ credentialId: 'cred-1' }));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('Cannot delete your last security key');
  });

  it('should allow deleting last key when TOTP is enabled', async () => {
    (prisma.webAuthnCredential.findUnique as jest.Mock).mockResolvedValue({
      id: 'cred-1',
      userId: 'user-1',
    });
    // Only 1 key remaining but TOTP is enabled (from makeElevatedAdmin)
    (prisma.webAuthnCredential.count as jest.Mock).mockResolvedValue(1);
    (prisma.webAuthnCredential.delete as jest.Mock).mockResolvedValue({});

    const response = await DELETE(createRequest({ credentialId: 'cred-1' }));
    expect(response.status).toBe(200);
  });

  it('should return 400 when credentialId is missing', async () => {
    const response = await DELETE(createRequest({}));
    expect(response.status).toBe(400);
  });
});

// ═══════════════════════════════════════════════════════════════
// PATCH /api/admin/webauthn/credentials
// ═══════════════════════════════════════════════════════════════

describe('PATCH /api/admin/webauthn/credentials', () => {
  it('should rename a credential', async () => {
    (prisma.webAuthnCredential.findUnique as jest.Mock).mockResolvedValue({
      id: 'cred-1',
      userId: 'user-1',
    });
    (prisma.webAuthnCredential.update as jest.Mock).mockResolvedValue({});

    const req = new NextRequest('http://localhost:3000/api/admin/webauthn/credentials', {
      method: 'PATCH',
      body: JSON.stringify({ credentialId: 'cred-1', nickname: 'My YubiKey' }),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await PATCH(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(prisma.webAuthnCredential.update).toHaveBeenCalledWith({
      where: { id: 'cred-1' },
      data: { nickname: 'My YubiKey' },
    });
  });

  it('should return 404 when credential belongs to different user', async () => {
    (prisma.webAuthnCredential.findUnique as jest.Mock).mockResolvedValue({
      id: 'cred-1',
      userId: 'other-user',
    });

    const req = new NextRequest('http://localhost:3000/api/admin/webauthn/credentials', {
      method: 'PATCH',
      body: JSON.stringify({ credentialId: 'cred-1', nickname: 'My Key' }),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await PATCH(req);
    expect(response.status).toBe(404);
  });
});
