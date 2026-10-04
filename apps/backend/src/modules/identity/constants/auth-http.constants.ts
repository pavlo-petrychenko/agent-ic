import { GlobalPrefix } from '@/platform/http/constants/global-prefix.constants';
import { URL_PATH_SEPARATOR } from '@/platform/http/constants/url.constants';

export enum AuthRoute {
  Base = 'auth',
  Login = 'login',
  Refresh = 'refresh',
  Logout = 'logout',
  ConfirmEmail = 'confirm-email',
  ResetPassword = 'reset-password',
}

export const REFRESH_COOKIE_NAME = '__Secure-rt';
export const REFRESH_COOKIE_PATH = ['', GlobalPrefix.Api, AuthRoute.Base].join(URL_PATH_SEPARATOR);
export const REFRESH_COOKIE_SAME_SITE = 'strict';
export const COOKIE_PAIR_SEPARATOR = ';';
export const COOKIE_VALUE_SEPARATOR = '=';
export const AUTH_REQUEST_CONTENT_TYPE = 'application/json';
export const MEDIA_TYPE_PARAMETER_SEPARATOR = ';';
export const SAME_ORIGIN_FETCH_SITE = 'same-origin';
