import { describe, expect, it } from 'vitest';
import { SECURE_TOKEN_BYTES } from '@/platform/crypto/constants/crypto.constants';
import { SecureTokenService } from '@/platform/crypto/services/secure-token.service';

const BASE64URL = /^[A-Za-z0-9_-]+$/;
const SHA256_HEX = /^[0-9a-f]{64}$/;

describe('SecureTokenService', () => {
  const tokens = new SecureTokenService();

  it('generates a url-safe token with its own hash', () => {
    const { token, hash } = tokens.generate();

    expect(token).toMatch(BASE64URL);
    expect(Buffer.from(token, 'base64url')).toHaveLength(SECURE_TOKEN_BYTES);
    expect(hash).toMatch(SHA256_HEX);
    expect(hash).toBe(tokens.hash(token));
  });

  it('never stores the token itself in the hash', () => {
    const { token, hash } = tokens.generate();

    expect(hash).not.toContain(token);
  });

  it('generates a different token every time', () => {
    expect(tokens.generate().token).not.toBe(tokens.generate().token);
  });

  it('matches a token against its hash only', () => {
    const first = tokens.generate();
    const second = tokens.generate();

    expect(tokens.matches(first.token, first.hash)).toBe(true);
    expect(tokens.matches(second.token, first.hash)).toBe(false);
  });

  it('rejects a malformed hash', () => {
    const { token } = tokens.generate();

    expect(tokens.matches(token, 'not-a-hash')).toBe(false);
  });
});
