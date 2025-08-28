/**
 * Encryption service for protecting sensitive data
 * Implements AES-256-GCM encryption with proper key management
 */

import crypto from 'crypto';
import { logger } from '../admin/utils/logger';

export interface EncryptedData {
  encrypted: string;
  iv: string;
  authTag: string;
  algorithm: string;
  keyVersion: number;
}

export class EncryptionService {
  private algorithm = 'aes-256-gcm';
  private keys: Map<number, Buffer> = new Map();
  private currentKeyVersion: number = 1;
  private saltRounds = 10;

  constructor() {
    this.initializeKeys();
  }

  private initializeKeys(): void {
    // Primary encryption key
    const primaryKey = process.env.ENCRYPTION_KEY;
    if (!primaryKey) {
      if (process.env.NODE_ENV === 'production') {
        throw new Error('ENCRYPTION_KEY environment variable is required in production');
      }
      // Use a default key for development only
      console.warn('⚠️  Using default encryption key (development only)');
      this.keys.set(1, Buffer.from('0'.repeat(64), 'hex'));
    } else {
      this.keys.set(1, Buffer.from(primaryKey, 'hex'));
    }

    // Support key rotation - load previous keys if they exist
    for (let i = 2; i <= 5; i++) {
      const key = process.env[`ENCRYPTION_KEY_V${i}`];
      if (key) {
        this.keys.set(i, Buffer.from(key, 'hex'));
        this.currentKeyVersion = Math.max(this.currentKeyVersion, i);
      }
    }

    logger.info('Encryption service initialized', {
      keyVersions: Array.from(this.keys.keys()),
      currentVersion: this.currentKeyVersion
    });
  }

  /**
   * Encrypts sensitive data using AES-256-GCM
   */
  encrypt(plaintext: string): EncryptedData {
    try {
      const key = this.keys.get(this.currentKeyVersion);
      if (!key) {
        throw new Error(`Encryption key version ${this.currentKeyVersion} not found`);
      }

      // Generate random IV for each encryption
      const iv = crypto.randomBytes(16);
      
      // Create cipher (cast to CipherGCM for GCM-specific methods)
      const cipher = crypto.createCipheriv(this.algorithm, key, iv) as crypto.CipherGCM;
      
      // Encrypt the data
      const encrypted = Buffer.concat([
        cipher.update(plaintext, 'utf8'),
        cipher.final()
      ]);
      
      // Get the authentication tag
      const authTag = cipher.getAuthTag();
      
      return {
        encrypted: encrypted.toString('base64'),
        iv: iv.toString('base64'),
        authTag: authTag.toString('base64'),
        algorithm: this.algorithm,
        keyVersion: this.currentKeyVersion
      };
    } catch (error) {
      logger.error('Encryption failed', error as Error);
      throw new Error('Failed to encrypt data');
    }
  }

  /**
   * Decrypts data encrypted with encrypt()
   */
  decrypt(encryptedData: EncryptedData): string {
    try {
      // Get the appropriate key version
      const key = this.keys.get(encryptedData.keyVersion || 1);
      if (!key) {
        throw new Error(`Decryption key version ${encryptedData.keyVersion} not found`);
      }

      // Decode from base64
      const encrypted = Buffer.from(encryptedData.encrypted, 'base64');
      const iv = Buffer.from(encryptedData.iv, 'base64');
      const authTag = Buffer.from(encryptedData.authTag, 'base64');
      
      // Create decipher (cast to DecipherGCM for GCM-specific methods)
      const decipher = crypto.createDecipheriv(
        encryptedData.algorithm || this.algorithm,
        key,
        iv
      ) as crypto.DecipherGCM;
      
      // Set auth tag for GCM mode
      decipher.setAuthTag(authTag);
      
      // Decrypt
      const decrypted = Buffer.concat([
        decipher.update(encrypted),
        decipher.final()
      ]);
      
      return decrypted.toString('utf8');
    } catch (error) {
      logger.error('Decryption failed', error as Error);
      throw new Error('Failed to decrypt data');
    }
  }

  /**
   * Encrypts a JSON object
   */
  encryptObject(obj: any): EncryptedData {
    return this.encrypt(JSON.stringify(obj));
  }

  /**
   * Decrypts a JSON object
   */
  decryptObject<T>(encryptedData: EncryptedData): T {
    const json = this.decrypt(encryptedData);
    return JSON.parse(json) as T;
  }

  /**
   * Hashes a value for indexing (one-way)
   */
  hash(value: string): string {
    return crypto
      .createHash('sha256')
      .update(value + (process.env.HASH_SALT || ''))
      .digest('hex');
  }

  /**
   * Creates a secure hash for passwords using scrypt
   */
  async hashPassword(password: string): Promise<string> {
    const salt = crypto.randomBytes(32);
    const hash = await this.scrypt(password, salt);
    return `${salt.toString('hex')}:${hash.toString('hex')}`;
  }

  /**
   * Verifies a password against a hash
   */
  async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    const [saltHex, hashHex] = hashedPassword.split(':');
    const salt = Buffer.from(saltHex, 'hex');
    const hash = Buffer.from(hashHex, 'hex');
    const testHash = await this.scrypt(password, salt);
    return crypto.timingSafeEqual(hash, testHash);
  }

  private scrypt(password: string, salt: Buffer): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      crypto.scrypt(password, salt, 64, (err, derivedKey) => {
        if (err) reject(err);
        else resolve(derivedKey);
      });
    });
  }

  /**
   * Generates a secure random token
   */
  generateToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Generates a secure random ID
   */
  generateId(): string {
    return crypto.randomUUID();
  }

  /**
   * Creates a deterministic token for a value (useful for unsubscribe links, etc)
   */
  createDeterministicToken(value: string, purpose: string): string {
    const hmac = crypto.createHmac('sha256', process.env.HMAC_SECRET || 'default-hmac-secret');
    hmac.update(`${purpose}:${value}`);
    return hmac.digest('hex');
  }

  /**
   * Verifies a deterministic token
   */
  verifyDeterministicToken(value: string, purpose: string, token: string): boolean {
    const expectedToken = this.createDeterministicToken(value, purpose);
    return crypto.timingSafeEqual(
      Buffer.from(token),
      Buffer.from(expectedToken)
    );
  }

  /**
   * Masks sensitive data for logging
   */
  mask(value: string, showLast: number = 4): string {
    if (!value || value.length <= showLast) {
      return '****';
    }
    return '*'.repeat(value.length - showLast) + value.slice(-showLast);
  }

  /**
   * Encrypts a file
   */
  async encryptFile(buffer: Buffer): Promise<Buffer> {
    const iv = crypto.randomBytes(16);
    const key = this.keys.get(this.currentKeyVersion)!;
    const cipher = crypto.createCipheriv(this.algorithm, key, iv) as crypto.CipherGCM;
    
    const encrypted = Buffer.concat([
      cipher.update(buffer),
      cipher.final()
    ]);
    
    const authTag = cipher.getAuthTag();
    
    // Prepend IV, auth tag, and key version
    return Buffer.concat([
      Buffer.from([this.currentKeyVersion]), // 1 byte for key version
      iv, // 16 bytes
      authTag, // 16 bytes
      encrypted
    ]);
  }

  /**
   * Decrypts a file
   */
  async decryptFile(encryptedBuffer: Buffer): Promise<Buffer> {
    const keyVersion = encryptedBuffer[0];
    const iv = encryptedBuffer.slice(1, 17);
    const authTag = encryptedBuffer.slice(17, 33);
    const encrypted = encryptedBuffer.slice(33);
    
    const key = this.keys.get(keyVersion);
    if (!key) {
      throw new Error(`Key version ${keyVersion} not found`);
    }
    
    const decipher = crypto.createDecipheriv(this.algorithm, key, iv) as crypto.DecipherGCM;
    decipher.setAuthTag(authTag);
    
    return Buffer.concat([
      decipher.update(encrypted),
      decipher.final()
    ]);
  }

  /**
   * Re-encrypts data with the latest key version (for key rotation)
   */
  reencrypt(encryptedData: EncryptedData): EncryptedData {
    if (encryptedData.keyVersion === this.currentKeyVersion) {
      return encryptedData; // Already using latest key
    }
    
    const plaintext = this.decrypt(encryptedData);
    return this.encrypt(plaintext);
  }

  /**
   * Checks if re-encryption is needed
   */
  needsReencryption(encryptedData: EncryptedData): boolean {
    return encryptedData.keyVersion !== this.currentKeyVersion;
  }
}

// Singleton instance
let encryptionService: EncryptionService | null = null;

export function getEncryptionService(): EncryptionService {
  if (!encryptionService) {
    encryptionService = new EncryptionService();
  }
  return encryptionService;
}

// Utility functions for common use cases
export const encryption = {
  /**
   * Encrypts PII data
   */
  encryptPII(data: string): string {
    const service = getEncryptionService();
    const encrypted = service.encrypt(data);
    return JSON.stringify(encrypted);
  },

  /**
   * Decrypts PII data
   */
  decryptPII(encryptedString: string): string {
    const service = getEncryptionService();
    const encryptedData = JSON.parse(encryptedString) as EncryptedData;
    return service.decrypt(encryptedData);
  },

  /**
   * Hashes email for indexing
   */
  hashEmail(email: string): string {
    const service = getEncryptionService();
    return service.hash(email.toLowerCase());
  },

  /**
   * Masks credit card number
   */
  maskCreditCard(cardNumber: string): string {
    const service = getEncryptionService();
    return service.mask(cardNumber.replace(/\s/g, ''), 4);
  },

  /**
   * Masks SSN
   */
  maskSSN(ssn: string): string {
    const service = getEncryptionService();
    return service.mask(ssn.replace(/-/g, ''), 4);
  },

  /**
   * Generates secure API key
   */
  generateApiKey(): string {
    const service = getEncryptionService();
    return `sk_${service.generateToken(32)}`;
  },

  /**
   * Generates secure session token
   */
  generateSessionToken(): string {
    const service = getEncryptionService();
    return service.generateToken(64);
  }
};