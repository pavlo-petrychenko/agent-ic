import { vi } from 'vitest';
import { getSessionClient } from '@/shared/api/clients/session.client';

const TEST_TOKEN_EXPIRY = '2030-01-01T00:00:00.000Z';
const NO_CONTENT_STATUS = 204;

export const signInForTest = (accessToken = 'test-access-token'): void => {
  getSessionClient().start({ accessToken, accessTokenExpiresAt: TEST_TOKEN_EXPIRY });
};

export const signOutForTest = async (): Promise<void> => {
  vi.stubGlobal(
    'fetch',
    vi.fn<typeof fetch>(() => Promise.resolve(new Response(null, { status: NO_CONTENT_STATUS }))),
  );
  await getSessionClient().end();
  vi.unstubAllGlobals();
};
