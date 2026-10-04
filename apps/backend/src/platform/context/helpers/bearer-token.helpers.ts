import {
  AUTHORIZATION_SEPARATOR,
  BEARER_SCHEME,
} from '@/platform/context/constants/bearer-token.constants';

export const readBearerToken = (authorization: string | null): string | null => {
  if (authorization === null) {
    return null;
  }
  const separator = authorization.indexOf(AUTHORIZATION_SEPARATOR);
  const scheme = authorization.slice(0, separator).toLowerCase();
  const token = authorization.slice(separator + 1).trim();
  return separator > 0 && scheme === BEARER_SCHEME && token.length > 0 ? token : null;
};
