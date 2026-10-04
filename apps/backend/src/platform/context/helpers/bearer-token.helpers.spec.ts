import { describe, expect, it } from 'vitest';
import { readBearerToken } from '@/platform/context/helpers/bearer-token.helpers';

describe('readBearerToken', () => {
  it('reads the token of a bearer authorization', () => {
    expect(readBearerToken('Bearer abc.def')).toBe('abc.def');
  });

  it('accepts the scheme in any case', () => {
    expect(readBearerToken('bearer abc')).toBe('abc');
  });

  it('ignores a missing header, another scheme or an empty token', () => {
    expect(readBearerToken(null)).toBeNull();
    expect(readBearerToken('Basic abc')).toBeNull();
    expect(readBearerToken('Bearer ')).toBeNull();
    expect(readBearerToken('Bearer')).toBeNull();
  });
});
