import { GOOGLE_CONNECTION_RETURN_STORAGE_KEY } from '@/features/knowledge/constants/googleConnection.constants';
import { googleConnectionReturnSchema } from '@/features/knowledge/logic/schemas/googleConnection.schema';
import type { GoogleConnectionReturn } from '@/features/knowledge/typedefs/googleConnection.typedefs';

export const saveGoogleConnectionReturn = (value: GoogleConnectionReturn): void => {
  sessionStorage.setItem(GOOGLE_CONNECTION_RETURN_STORAGE_KEY, JSON.stringify(value));
};

export const readGoogleConnectionReturn = (): GoogleConnectionReturn | null => {
  let raw: string | null;
  try {
    raw = sessionStorage.getItem(GOOGLE_CONNECTION_RETURN_STORAGE_KEY);
  } catch {
    return null;
  }
  if (raw === null) {
    return null;
  }
  try {
    const parsed = googleConnectionReturnSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
};

export const clearGoogleConnectionReturn = (): void => {
  try {
    sessionStorage.removeItem(GOOGLE_CONNECTION_RETURN_STORAGE_KEY);
  } catch {
    return;
  }
};

export const redirectToGoogle = (authorizationUrl: string): void => {
  window.location.assign(authorizationUrl);
};
