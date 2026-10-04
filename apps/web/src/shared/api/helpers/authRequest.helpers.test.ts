import { ErrorCode, ErrorReason } from '@agent-ic/contracts';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AuthEndpoint } from '@/shared/api/constants/authApi.constants';
import { ClientErrorCode } from '@/shared/api/constants/clientError.constants';
import { postAuthRequest } from '@/shared/api/helpers/authRequest.helpers';

const stubFetch = (response: Response | Error) => {
  const fetchMock = vi.fn<typeof fetch>(() =>
    response instanceof Error ? Promise.reject(response) : Promise.resolve(response),
  );
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
};

describe('postAuthRequest', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('posts JSON to the same origin with cookies, even without a body', async () => {
    const fetchMock = stubFetch(new Response(null, { status: 204 }));

    await expect(postAuthRequest(AuthEndpoint.Logout)).resolves.toBeNull();

    expect(fetchMock).toHaveBeenCalledWith('/api/auth/logout', {
      method: 'POST',
      mode: 'same-origin',
      credentials: 'include',
      headers: { 'content-type': 'application/json' },
      body: '{}',
    });
  });

  it('returns the parsed JSON body', async () => {
    stubFetch(new Response(JSON.stringify({ email: 'ada@example.com' }), { status: 200 }));

    await expect(
      postAuthRequest(AuthEndpoint.SignUp, { email: 'ada@example.com' }),
    ).resolves.toEqual({ email: 'ada@example.com' });
  });

  it('turns problem+json into an AppError with code, reason and field issues', async () => {
    const problem = {
      code: ErrorCode.BadUserInput,
      reason: ErrorReason.InvalidRequest,
      detail: 'Invalid input',
      errors: [{ path: 'email', reason: ErrorReason.InvalidEmail }],
    };
    stubFetch(new Response(JSON.stringify(problem), { status: 422 }));

    await expect(postAuthRequest(AuthEndpoint.Login, {})).rejects.toMatchObject({
      code: ErrorCode.BadUserInput,
      reason: ErrorReason.InvalidRequest,
      fields: [{ path: 'email', reason: ErrorReason.InvalidEmail }],
    });
  });

  it('reports a failed connection as a network error', async () => {
    stubFetch(new TypeError('Failed to fetch'));

    await expect(postAuthRequest(AuthEndpoint.Refresh)).rejects.toMatchObject({
      code: ClientErrorCode.Network,
    });
  });
});
