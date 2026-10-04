import {
  AUTH_REQUEST_CONTENT_TYPE,
  MEDIA_TYPE_PARAMETER_SEPARATOR,
  SAME_ORIGIN_FETCH_SITE,
} from '@/modules/identity/constants/auth-http.constants';
import type { AuthRequestHeaders } from '@/modules/identity/typedefs/auth-request.typedefs';

export const isJsonRequest = (headers: AuthRequestHeaders): boolean =>
  headers.contentType?.split(MEDIA_TYPE_PARAMETER_SEPARATOR)[0]?.trim().toLowerCase() ===
  AUTH_REQUEST_CONTENT_TYPE;

export const isSameOriginRequest = (headers: AuthRequestHeaders, allowedOrigin: string): boolean =>
  headers.origin === null
    ? headers.fetchSite === SAME_ORIGIN_FETCH_SITE
    : headers.origin === allowedOrigin;
