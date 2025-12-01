import * as OTPAuth from 'otpauth';
import QRCode from 'qrcode';
import crypto from 'crypto';

// Encryption key for storing TOTP secrets (use env variable in production)
const ENCRYPTION_KEY = process.env.TOTP_ENCRYPTION_KEY || 'default-key-change-in-production-32';

// Ensure key is exactly 32 bytes for AES-256
function getEncryptionKey(): Buffer {
  const key = ENCRYPTION_KEY;
  return crypto.createHash('sha256').update(key).digest();
}

// Encrypt TOTP secret before storing in database
export function encryptSecret(secret: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', getEncryptionKey(), iv);
  let encrypted = cipher.update(secret, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

// Decrypt TOTP secret from database
export function decryptSecret(encryptedSecret: string): string {
  const [ivHex, encrypted] = encryptedSecret.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', getEncryptionKey(), iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

// Generate a new TOTP secret
export function generateTOTPSecret(userEmail: string): { secret: string; uri: string } {
  const totp = new OTPAuth.TOTP({
    issuer: 'Full Uproar Admin',
    label: userEmail,
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
    secret: new OTPAuth.Secret({ size: 20 }),
  });

  return {
    secret: totp.secret.base32,
    uri: totp.toString(),
  };
}

// Generate QR code as data URL
export async function generateQRCode(uri: string): Promise<string> {
  try {
    return await QRCode.toDataURL(uri, {
      width: 256,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    });
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw new Error('Failed to generate QR code');
  }
}

// Verify a TOTP code
export function verifyTOTP(secret: string, token: string): boolean {
  const totp = new OTPAuth.TOTP({
    issuer: 'Full Uproar Admin',
    label: 'admin',
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
    secret: OTPAuth.Secret.fromBase32(secret),
  });

  // Allow 1 period of drift (30 seconds before/after)
  const delta = totp.validate({ token, window: 1 });
  return delta !== null;
}

// Check if admin elevation is still valid
export function isElevationValid(elevatedUntil: Date | null): boolean {
  if (!elevatedUntil) return false;
  return new Date() < new Date(elevatedUntil);
}

// Get elevation expiry time (30 minutes from now)
export function getElevationExpiry(): Date {
  const expiry = new Date();
  expiry.setMinutes(expiry.getMinutes() + 30);
  return expiry;
}
