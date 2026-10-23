import crypto from 'node:crypto';

/**
 * INARO — Dump Mode AES-256-GCM Authenticated Encryption Utility
 * 
 * Guarantees zero plaintext exposure at rest in the PostgreSQL database.
 * Formats encrypted payload in a versioned string:
 *   v1:<iv_hex>:<ciphertext_hex>:<authTag_hex>
 */

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 96-bit IV recommended for GCM
const AUTH_TAG_LENGTH = 16; // 128-bit authentication tag

function getEncryptionKey(): Buffer {
  const envKey = process.env.DUMP_ENCRYPTION_KEY;
  if (!envKey) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('DUMP_ENCRYPTION_KEY environment variable is required in production');
    }
    // Safe deterministic development fallback key (32 bytes)
    return crypto.createHash('sha256').update('inaro-development-dump-encryption-key-32b').digest();
  }

  // If 64 hex characters (32 bytes hex-encoded)
  if (/^[0-9a-fA-F]{64}$/.test(envKey)) {
    return Buffer.from(envKey, 'hex');
  }

  // If 44 base64 characters (32 bytes base64-encoded)
  if (/^[A-Za-z0-9+/]{43}=$/.test(envKey)) {
    return Buffer.from(envKey, 'base64');
  }

  // Otherwise derive exact 32 bytes using SHA-256
  return crypto.createHash('sha256').update(envKey).digest();
}

/**
 * Encrypt plaintext string using AES-256-GCM.
 * Never logs plaintext.
 */
export function encryptDumpText(plainText: string): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });

  const ciphertext = Buffer.concat([
    cipher.update(plainText, 'utf8'),
    cipher.final(),
  ]);

  const authTag = cipher.getAuthTag();

  return `v1:${iv.toString('hex')}:${ciphertext.toString('hex')}:${authTag.toString('hex')}`;
}

/**
 * Decrypt stored ciphertext string using AES-256-GCM.
 * Validates version and authentication tag before returning plaintext.
 */
export function decryptDumpText(encryptedText: string): string {
  if (!encryptedText || typeof encryptedText !== 'string') {
    throw new Error('Invalid encrypted payload');
  }

  const parts = encryptedText.split(':');
  if (parts.length !== 4 || parts[0] !== 'v1') {
    throw new Error('Unsupported encryption version or malformed ciphertext');
  }

  const [, ivHex, cipherHex, tagHex] = parts;
  const iv = Buffer.from(ivHex, 'hex');
  const ciphertext = Buffer.from(cipherHex, 'hex');
  const authTag = Buffer.from(tagHex, 'hex');

  if (iv.length !== IV_LENGTH || authTag.length !== AUTH_TAG_LENGTH) {
    throw new Error('Invalid ciphertext metadata parameters');
  }

  const key = getEncryptionKey();
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });

  decipher.setAuthTag(authTag);

  try {
    const decrypted = Buffer.concat([
      decipher.update(ciphertext),
      decipher.final(),
    ]);

    return decrypted.toString('utf8');
  } catch {
    // Never expose crypto details or stack traces to caller
    throw new Error('Decryption authentication failed');
  }
}
