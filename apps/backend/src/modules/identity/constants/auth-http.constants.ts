import type { CookieOptions } from 'express';
import { EMAIL_CONFIRMATION_TTL_SECONDS } from '@/modules/identity/constants/identity.constants';
import { MILLISECONDS_PER_SECOND } from '@/platform/clock/constants/time.constants';
import { GlobalPrefix } from '@/platform/http/constants/global-prefix.constants';
import { URL_PATH_SEPARATOR } from '@/platform/http/constants/url.constants';

export enum AuthRoute {
  Base = 'auth',
  SignUp = 'sign-up',
  Login = 'login',
  Refresh = 'refresh',
  Logout = 'logout',
  ConfirmEmail = 'confirm-email',
  ResetPassword = 'reset-password',
}

export const REFRESH_COOKIE_NAME = '__Secure-rt';
export const CONFIRMATION_COOKIE_NAME = '__Secure-cb';
export const AUTH_COOKIE_PATH = ['', GlobalPrefix.Api, AuthRoute.Base].join(URL_PATH_SEPARATOR);
export const AUTH_COOKIE_SAME_SITE = 'strict';
export const AUTH_COOKIE_OPTIONS: Readonly<CookieOptions> = {
  httpOnly: true,
  secure: true,
  sameSite: AUTH_COOKIE_SAME_SITE,
  path: AUTH_COOKIE_PATH,
};
export const CONFIRMATION_COOKIE_MAX_AGE_MS =
  EMAIL_CONFIRMATION_TTL_SECONDS * MILLISECONDS_PER_SECOND;
export const COOKIE_PAIR_SEPARATOR = ';';
export const COOKIE_VALUE_SEPARATOR = '=';
export const AUTH_REQUEST_CONTENT_TYPE = 'application/json';
export const MEDIA_TYPE_PARAMETER_SEPARATOR = ';';
export const SAME_ORIGIN_FETCH_SITE = 'same-origin';
