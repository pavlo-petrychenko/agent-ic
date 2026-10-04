import type { Request, Response } from 'express';
import {
  AUTH_COOKIE_OPTIONS,
  CONFIRMATION_COOKIE_MAX_AGE_MS,
  CONFIRMATION_COOKIE_NAME,
} from '@/modules/identity/constants/auth-http.constants';
import { readCookie } from '@/modules/identity/helpers/cookie.helpers';
import type { SignUpResponse, SignUpResult } from '@/modules/identity/typedefs/account.typedefs';
import { HttpHeader } from '@/platform/http/constants/http-header.constants';

export const readConfirmationCookie = (request: Request): string | null =>
  readCookie(request.get(HttpHeader.Cookie) ?? null, CONFIRMATION_COOKIE_NAME);

export const bindConfirmationBrowser = (
  response: Response,
  result: SignUpResult,
): SignUpResponse => {
  response.cookie(CONFIRMATION_COOKIE_NAME, result.browserBinding, {
    ...AUTH_COOKIE_OPTIONS,
    maxAge: CONFIRMATION_COOKIE_MAX_AGE_MS,
  });
  return { email: result.email };
};

export const releaseConfirmationBrowser = (response: Response): void => {
  response.clearCookie(CONFIRMATION_COOKIE_NAME, AUTH_COOKIE_OPTIONS);
};
