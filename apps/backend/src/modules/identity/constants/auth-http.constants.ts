import { GlobalPrefix } from '@/platform/http/constants/global-prefix.constants';
import { URL_PATH_SEPARATOR } from '@/platform/http/constants/url.constants';

export enum AuthRoute {
  Base = 'auth',
  Login = 'login',
  Refresh = 'refresh',
  Logout = 'logout',
  ConfirmEmail = 'confirm-email',
}

export const REFRESH_COOKIE_NAME = '__Secure-rt';
export const REFRESH_COOKIE_PATH = ['', GlobalPrefix.Api, AuthRoute.Base].join(URL_PATH_SEPARATOR);
export const REFRESH_COOKIE_SAME_SITE = 'strict';
export const COOKIE_PAIR_SEPARATOR = ';';
export const COOKIE_VALUE_SEPARATOR = '=';
