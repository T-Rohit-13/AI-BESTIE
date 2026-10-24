import crypto from 'crypto';

/**
 * AES-256-GCM Authenticated Encryption for Dump Mode Text Entries
 *
 * Requirements:
 * - AES-256-GCM
 * - Key derived from DUMP_ENCRYPTION_KEY environment variable
 * - Cryptographically random 12-byte IV / nonce per entry
 * - 16-byte authentication tag
 * - Versioned format: version:1:iv:ciphertext:authTag
 * - Decrypted only when returning entries to the authenticated owner
 * - Never logs or leaks plaintext
 */

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 96 bits recommended for GCM
const AUTH_TAG_LENGTH = 16; // 128 bits
const VERSION_PREFIX = 'version:1';

/**
 * Returns a 32-byte Buffer key from DUMP_ENCRYPTION_KEY.
 * If key is provided as a 64-character hex string, it is parsed directly.
 * If provided as a base64 string or passphrase, it is hashed with SHA-256 to ensure exact 32-byte length.
 */
function getEncryptionKey(): Buffer {
  const envKey = process.env.DUMP_ENCRYPTION_KEY || 'inaro_default_dump_dev_encryption_key_min_32_bytes_long';

  // If 64 hex characters, convert directly
  if (/^[0-9a-fA-F]{64}$/.test(envKey)) {
    return Buffer.from(envKey, 'hex');
  }

  // Derive stable 256-bit key
  return crypto.createHash('sha256').update(envKey).digest();
}

/**
 * Encrypts a plaintext string into a versioned serialized ciphertext string:
 * version:1:<hex-iv>:<hex-ciphertext>:<hex-authTag>
 */
export function encryptDumpText(plaintext: string): string {
  if (typeof plaintext !== 'string') {
    throw new Error('Plaintext must be a string');
  }

  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });

  const ciphertext = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);

  const authTag = cipher.getAuthTag();

  return `${VERSION_PREFIX}:${iv.toString('hex')}:${ciphertext.toString('hex')}:${authTag.toString('hex')}`;
}

/**
 * Decrypts a versioned serialized ciphertext string.
 * Verifies authenticity before returning decrypted plaintext.
 */
export function decryptDumpText(encryptedData: string): string {
  if (!encryptedData || typeof encryptedData !== 'string') {
    throw new Error('Invalid encrypted data format');
  }

  const parts = encryptedData.split(':');

  // Format: "version", "1", "<iv>", "<ciphertext>", "<authTag>"
  if (parts.length !== 5 || parts[0] !== 'version' || parts[1] !== '1') {
    throw new Error('Unsupported or malformed encryption payload version');
  }

  const [, , ivHex, ciphertextHex, authTagHex] = parts;

  const key = getEncryptionKey();
  const iv = Buffer.from(ivHex, 'hex');
  const ciphertext = Buffer.from(ciphertextHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');

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
    throw new Error('Decryption failed: corrupted ciphertext or authentication tag mismatch');
  }
}
