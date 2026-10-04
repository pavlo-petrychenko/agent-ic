import { describe, expect, it } from 'vitest';
import { REFRESH_COOKIE_NAME } from '@/modules/identity/constants/auth-http.constants';
import { readCookie } from '@/modules/identity/helpers/refresh-cookie.helpers';

describe('readCookie', () => {
  it('finds the named cookie among others', () => {
    expect(
      readCookie(`theme=dark; ${REFRESH_COOKIE_NAME}=abc-123; lang=uk`, REFRESH_COOKIE_NAME),
    ).toBe('abc-123');
  });

  it('returns null when the cookie or the header is missing', () => {
    expect(readCookie('theme=dark', REFRESH_COOKIE_NAME)).toBeNull();
    expect(readCookie(null, REFRESH_COOKIE_NAME)).toBeNull();
  });

  it('does not match a cookie whose name only ends with the name', () => {
    expect(readCookie(`x${REFRESH_COOKIE_NAME}=stolen`, REFRESH_COOKIE_NAME)).toBeNull();
  });
});
