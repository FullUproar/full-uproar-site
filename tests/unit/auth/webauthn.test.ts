/**
 * @jest-environment node
 */

/**
 * WebAuthn Helpers Tests
 *
 * Tests lib/auth/webauthn.ts
 * - Challenge store (store, retrieve, expire, cleanup)
 * - Registration option generation
 * - Authentication option generation
 */

// ─── Mocks ──────────────────────────────────────────────────────

jest.mock('@simplewebauthn/server', () => ({
  generateRegistrationOptions: jest.fn().mockResolvedValue({
    challenge: 'test-challenge-abc',
    rp: { name: 'Full Uproar Admin', id: 'localhost' },
    user: { id: 'user-1', name: 'admin@fulluproar.com' },
    pubKeyCredParams: [],
  }),
  verifyRegistrationResponse: jest.fn().mockResolvedValue({
    verified: true,
    registrationInfo: {
      credentialID: new Uint8Array([1, 2, 3]),
      credentialPublicKey: new Uint8Array([4, 5, 6]),
      counter: 0,
      credentialDeviceType: 'singleDevice',
      credentialBackedUp: false,
    },
  }),
  generateAuthenticationOptions: jest.fn().mockResolvedValue({
    challenge: 'test-auth-challenge',
    rpId: 'localhost',
    allowCredentials: [],
  }),
  verifyAuthenticationResponse: jest.fn().mockResolvedValue({
    verified: true,
    authenticationInfo: {
      credentialID: new Uint8Array([1, 2, 3]),
      newCounter: 1,
      userVerified: false,
      credentialDeviceType: 'singleDevice',
      credentialBackedUp: false,
    },
  }),
}));

// ─── Imports ────────────────────────────────────────────────────

import {
  storeChallenge,
  getAndDeleteChallenge,
  generateRegistrationOpts,
  verifyRegistrationResp,
  generateAuthenticationOpts,
  verifyAuthenticationResp,
} from '@/lib/auth/webauthn';
import {
  generateRegistrationOptions,
  generateAuthenticationOptions,
  verifyRegistrationResponse,
  verifyAuthenticationResponse,
} from '@simplewebauthn/server';

const mockGenRegOpts = generateRegistrationOptions as jest.Mock;
const mockGenAuthOpts = generateAuthenticationOptions as jest.Mock;
const mockVerifyReg = verifyRegistrationResponse as jest.Mock;
const mockVerifyAuth = verifyAuthenticationResponse as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  process.env.WEBAUTHN_RP_ID = 'localhost';
  process.env.WEBAUTHN_ORIGIN = 'http://localhost:3000';
});

// ═══════════════════════════════════════════════════════════════
// Challenge Store
// ═══════════════════════════════════════════════════════════════

describe('Challenge Store', () => {
  it('should store and retrieve a challenge', () => {
    storeChallenge('user-1', 'my-challenge');
    const result = getAndDeleteChallenge('user-1');
    expect(result).toBe('my-challenge');
  });

  it('should delete challenge after retrieval', () => {
    storeChallenge('user-1', 'my-challenge');
    getAndDeleteChallenge('user-1');
    const result = getAndDeleteChallenge('user-1');
    expect(result).toBeNull();
  });

  it('should return null for unknown userId', () => {
    const result = getAndDeleteChallenge('nonexistent');
    expect(result).toBeNull();
  });

  it('should overwrite challenge for same userId', () => {
    storeChallenge('user-1', 'first');
    storeChallenge('user-1', 'second');
    const result = getAndDeleteChallenge('user-1');
    expect(result).toBe('second');
  });
});

// ═══════════════════════════════════════════════════════════════
// Registration
// ═══════════════════════════════════════════════════════════════

describe('generateRegistrationOpts', () => {
  it('should call generateRegistrationOptions with correct params', async () => {
    const result = await generateRegistrationOpts('user-1', 'admin@fulluproar.com', []);
    expect(mockGenRegOpts).toHaveBeenCalledWith(
      expect.objectContaining({
        rpName: 'Full Uproar Admin',
        rpID: 'localhost',
        userID: Buffer.from('user-1').toString('base64url'),
        userName: 'admin@fulluproar.com',
        attestationType: 'none',
        authenticatorSelection: expect.objectContaining({
          authenticatorAttachment: 'cross-platform',
          userVerification: 'discouraged',
        }),
      }),
    );
    expect(result).toHaveProperty('challenge');
  });

  it('should store challenge for the user', async () => {
    await generateRegistrationOpts('user-1', 'admin@fulluproar.com', []);
    const challenge = getAndDeleteChallenge('user-1');
    expect(challenge).toBe('test-challenge-abc');
  });

  it('should pass existing credentials as excludeCredentials', async () => {
    const existing = [
      {
        credentialId: 'AQID', // base64url of [1,2,3]
        publicKey: Buffer.from([4, 5, 6]),
        counter: BigInt(0),
        transports: ['usb'],
        deviceType: 'singleDevice',
        backedUp: false,
      },
    ];

    await generateRegistrationOpts('user-1', 'admin@fulluproar.com', existing);

    expect(mockGenRegOpts).toHaveBeenCalledWith(
      expect.objectContaining({
        excludeCredentials: expect.arrayContaining([
          expect.objectContaining({
            type: 'public-key',
            transports: ['usb'],
          }),
        ]),
      }),
    );
  });
});

describe('verifyRegistrationResp', () => {
  it('should verify against stored challenge', async () => {
    storeChallenge('user-1', 'stored-challenge');

    const mockResponse = { id: 'test', rawId: 'test', response: {}, type: 'public-key' };
    await verifyRegistrationResp('user-1', mockResponse as any);

    expect(mockVerifyReg).toHaveBeenCalledWith(
      expect.objectContaining({
        expectedChallenge: 'stored-challenge',
        expectedOrigin: ['http://localhost:3000'],
        expectedRPID: 'localhost',
      }),
    );
  });

  it('should throw if challenge expired or not found', async () => {
    await expect(
      verifyRegistrationResp('nonexistent-user', {} as any),
    ).rejects.toThrow('Challenge expired or not found');
  });
});

// ═══════════════════════════════════════════════════════════════
// Authentication
// ═══════════════════════════════════════════════════════════════

describe('generateAuthenticationOpts', () => {
  it('should call generateAuthenticationOptions with credentials', async () => {
    const creds = [
      {
        credentialId: 'AQID',
        publicKey: Buffer.from([4, 5, 6]),
        counter: BigInt(0),
        transports: ['usb'],
        deviceType: 'singleDevice',
        backedUp: false,
      },
    ];

    await generateAuthenticationOpts('user-1', creds);

    expect(mockGenAuthOpts).toHaveBeenCalledWith(
      expect.objectContaining({
        rpID: 'localhost',
        userVerification: 'discouraged',
        allowCredentials: expect.arrayContaining([
          expect.objectContaining({
            type: 'public-key',
            transports: ['usb'],
          }),
        ]),
      }),
    );
  });

  it('should store challenge for the user', async () => {
    await generateAuthenticationOpts('user-1', []);
    const challenge = getAndDeleteChallenge('user-1');
    expect(challenge).toBe('test-auth-challenge');
  });
});

describe('verifyAuthenticationResp', () => {
  it('should verify against stored challenge and credential', async () => {
    storeChallenge('user-1', 'auth-challenge');

    const cred = {
      credentialId: 'AQID',
      publicKey: Buffer.from([4, 5, 6]),
      counter: BigInt(5),
      transports: ['usb'],
      deviceType: 'singleDevice',
      backedUp: false,
    };

    const result = await verifyAuthenticationResp('user-1', {} as any, cred);

    expect(mockVerifyAuth).toHaveBeenCalledWith(
      expect.objectContaining({
        expectedChallenge: 'auth-challenge',
        expectedOrigin: ['http://localhost:3000'],
        expectedRPID: 'localhost',
      }),
    );
    expect(result.verified).toBe(true);
  });

  it('should throw if challenge not found', async () => {
    const cred = {
      credentialId: 'AQID',
      publicKey: Buffer.from([4, 5, 6]),
      counter: BigInt(0),
      transports: ['usb'],
      deviceType: 'singleDevice',
      backedUp: false,
    };

    await expect(
      verifyAuthenticationResp('no-challenge-user', {} as any, cred),
    ).rejects.toThrow('Challenge expired or not found');
  });
});
