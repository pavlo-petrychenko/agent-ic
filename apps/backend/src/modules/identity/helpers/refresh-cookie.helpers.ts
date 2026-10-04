import type { Request, Response } from 'express';
import {
  AUTH_COOKIE_OPTIONS,
  REFRESH_COOKIE_NAME,
} from '@/modules/identity/constants/auth-http.constants';
import { readCookie } from '@/modules/identity/helpers/cookie.helpers';
import type { AuthSessionResponse } from '@/modules/identity/typedefs/account.typedefs';
import type { IssuedSession } from '@/modules/identity/typedefs/session.typedefs';
import { HttpHeader } from '@/platform/http/constants/http-header.constants';

export const readRefreshCookie = (request: Request): string | null =>
  readCookie(request.get(HttpHeader.Cookie) ?? null, REFRESH_COOKIE_NAME);

export const startBrowserSession = (
  response: Response,
  session: IssuedSession,
): AuthSessionResponse => {
  response.cookie(REFRESH_COOKIE_NAME, session.refreshToken, {
    ...AUTH_COOKIE_OPTIONS,
    expires: session.refreshTokenExpiresAt,
  });
  return {
    accessToken: session.accessToken,
    accessTokenExpiresAt: session.accessTokenExpiresAt.toISOString(),
  };
};

export const endBrowserSession = (response: Response): void => {
  response.clearCookie(REFRESH_COOKIE_NAME, AUTH_COOKIE_OPTIONS);
};
