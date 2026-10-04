import type { CookieOptions, Request, Response } from 'express';
import {
  COOKIE_PAIR_SEPARATOR,
  COOKIE_VALUE_SEPARATOR,
  REFRESH_COOKIE_NAME,
  REFRESH_COOKIE_PATH,
  REFRESH_COOKIE_SAME_SITE,
} from '@/modules/identity/constants/auth-http.constants';
import type { AuthSessionResponse } from '@/modules/identity/typedefs/account.typedefs';
import type { IssuedSession } from '@/modules/identity/typedefs/session.typedefs';
import { HttpHeader } from '@/platform/http/constants/http-header.constants';

const REFRESH_COOKIE_OPTIONS: CookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: REFRESH_COOKIE_SAME_SITE,
  path: REFRESH_COOKIE_PATH,
};

export const readCookie = (header: string | null, name: string): string | null => {
  for (const pair of (header ?? '').split(COOKIE_PAIR_SEPARATOR)) {
    const separator = pair.indexOf(COOKIE_VALUE_SEPARATOR);
    if (separator > 0 && pair.slice(0, separator).trim() === name) {
      return pair.slice(separator + 1).trim();
    }
  }
  return null;
};

export const readRefreshCookie = (request: Request): string | null =>
  readCookie(request.get(HttpHeader.Cookie) ?? null, REFRESH_COOKIE_NAME);

export const startBrowserSession = (
  response: Response,
  session: IssuedSession,
): AuthSessionResponse => {
  response.cookie(REFRESH_COOKIE_NAME, session.refreshToken, {
    ...REFRESH_COOKIE_OPTIONS,
    expires: session.refreshTokenExpiresAt,
  });
  return {
    accessToken: session.accessToken,
    accessTokenExpiresAt: session.accessTokenExpiresAt.toISOString(),
  };
};

export const endBrowserSession = (response: Response): void => {
  response.clearCookie(REFRESH_COOKIE_NAME, REFRESH_COOKIE_OPTIONS);
};
