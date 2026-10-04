import {
  COOKIE_PAIR_SEPARATOR,
  COOKIE_VALUE_SEPARATOR,
} from '@/modules/identity/constants/auth-http.constants';

export const readCookie = (header: string | null, name: string): string | null => {
  for (const pair of (header ?? '').split(COOKIE_PAIR_SEPARATOR)) {
    const separator = pair.indexOf(COOKIE_VALUE_SEPARATOR);
    if (separator > 0 && pair.slice(0, separator).trim() === name) {
      return pair.slice(separator + 1).trim();
    }
  }
  return null;
};
