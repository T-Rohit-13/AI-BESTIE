import { describe, it, expect } from 'vitest';
import { encryptDumpText, decryptDumpText } from '../src/utils/encryption';

describe('Dump Mode Encryption Utility (AES-256-GCM)', () => {
  it('encrypts plaintext into version:1:iv:ciphertext:authTag format', () => {
    const plaintext = 'I had an exhausting day at college and felt overwhelmed.';
    const encrypted = encryptDumpText(plaintext);

    expect(encrypted).toMatch(/^version:1:[0-9a-f]{24}:[0-9a-f]+:[0-9a-f]{32}$/);
    expect(encrypted).not.toContain(plaintext);
  });

  it('decrypts encrypted text back to original plaintext', () => {
    const original = 'Today I finally talked to my counselor. Breathing feels easier.';
    const encrypted = encryptDumpText(original);
    const decrypted = decryptDumpText(encrypted);

    expect(decrypted).toBe(original);
  });

  it('produces different ciphertexts for identical plaintext due to random IV', () => {
    const text = 'Repeated thoughts and worries';
    const enc1 = encryptDumpText(text);
    const enc2 = encryptDumpText(text);

    expect(enc1).not.toBe(enc2);
    expect(decryptDumpText(enc1)).toBe(text);
    expect(decryptDumpText(enc2)).toBe(text);
  });

  it('fails decryption when ciphertext or authTag is tampered', () => {
    const text = 'Secret reflections';
    const encrypted = encryptDumpText(text);

    // Tamper with the last character
    const tampered = encrypted.slice(0, -2) + (encrypted.slice(-2) === 'aa' ? 'bb' : 'aa');

    expect(() => decryptDumpText(tampered)).toThrow(/corrupted ciphertext or authentication tag/i);
  });

  it('rejects malformed encryption payload strings', () => {
    expect(() => decryptDumpText('invalid_string')).toThrow(/unsupported or malformed/i);
    expect(() => decryptDumpText('version:2:iv:cipher:tag')).toThrow(/unsupported or malformed/i);
  });
});
