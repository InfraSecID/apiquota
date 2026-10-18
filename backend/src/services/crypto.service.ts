import crypto from 'crypto';
import { env } from '../config/env';

/**
 * Service for AES-256-GCM authenticated encryption and decryption.
 * Conforms to NIST SP 800-38D standards.
 */
export class CryptoService {
  private static readonly ALGORITHM = 'aes-256-gcm';
  private static readonly IV_LENGTH = 16; // 16 bytes IV
  private static readonly AUTH_TAG_LENGTH = 16; // 16 bytes (128 bits) Auth Tag

  /**
   * Retrieves the 32-byte binary key from configuration
   */
  private static getMasterKey(): Buffer {
    const rawKey = env.ENCRYPTION_MASTER_KEY;
    if (/^[0-9a-fA-F]{64}$/.test(rawKey)) {
      return Buffer.from(rawKey, 'hex');
    }
    return Buffer.from(rawKey, 'utf8').subarray(0, 32);
  }

  /**
   * Encrypts plaintext string using AES-256-GCM.
   * Format: <iv_hex>:<authTag_hex>:<ciphertext_hex>
   */
  public static encrypt(plainText: string): string {
    if (!plainText || typeof plainText !== 'string') {
      throw new Error('Encryption payload must be a non-empty string');
    }

    const key = this.getMasterKey();
    const iv = crypto.randomBytes(this.IV_LENGTH);

    const cipher = crypto.createCipheriv(this.ALGORITHM, key, iv);
    let ciphertext = cipher.update(plainText, 'utf8', 'hex');
    ciphertext += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    // Packed serialization format
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${ciphertext}`;
  }

  /**
   * Decrypts ciphertext formatted as <iv_hex>:<authTag_hex>:<ciphertext_hex>.
   * Throws error if key is wrong or data was tampered with.
   */
  public static decrypt(encryptedPackage: string): string {
    if (!encryptedPackage || typeof encryptedPackage !== 'string') {
      throw new Error('Ciphertext payload must be a non-empty string');
    }

    const parts = encryptedPackage.split(':');
    if (parts.length !== 3) {
      throw new Error('Malformed encrypted payload. Expected format: iv:authTag:ciphertext');
    }

    const [ivHex, authTagHex, cipherTextHex] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    if (iv.length !== this.IV_LENGTH) {
      throw new Error(`Invalid IV length: expected ${this.IV_LENGTH} bytes`);
    }

    if (authTag.length !== this.AUTH_TAG_LENGTH) {
      throw new Error(`Invalid AuthTag length: expected ${this.AUTH_TAG_LENGTH} bytes`);
    }

    const key = this.getMasterKey();
    const decipher = crypto.createDecipheriv(this.ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    try {
      let decrypted = decipher.update(cipherTextHex, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch (err: any) {
      throw new Error('Decryption failed: Ciphertext integrity check or authentication failed (invalid key or tampered data)');
    }
  }
}
