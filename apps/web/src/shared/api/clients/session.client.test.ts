import { ErrorCode, ErrorReason } from '@agent-ic/contracts';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createSessionClient } from '@/shared/api/clients/session.client';
import { AuthEndpoint } from '@/shared/api/constants/authApi.constants';
import { ClientErrorCode } from '@/shared/api/constants/clientError.constants';
import { SessionStatus } from '@/shared/api/constants/session.constants';
import { AppError } from '@/shared/api/errors/app.error';
import { getRequestContext, setAccessToken } from '@/shared/api/helpers/requestContext.helpers';
import type { AuthRequest, SessionLocks } from '@/shared/api/typedefs/session.typedefs';

const NOW = Date.parse('2026-10-04T12:00:00.000Z');
const tokens = (accessToken: string, expiresInMs = 15 * 60_000) => ({
  accessToken,
  accessTokenExpiresAt: new Date(NOW + expiresInMs).toISOString(),
});
const rejected = (reason: ErrorReason | null, code: AppError['code'] = ErrorCode.Unauthenticated) =>
  new AppError('Rejected', { code, reason });

const setup = (post: AuthRequest, locks: SessionLocks | null = null) => {
  const postMock = vi.fn<AuthRequest>(post);
  const client = createSessionClient({ post: postMock, locks, now: () => NOW });
  return { client, postMock };
};

describe('sessionClient', () => {
  afterEach(() => setAccessToken(null));

  it('restores the session from the refresh cookie and keeps the token in memory', async () => {
    const { client, postMock } = setup(() => Promise.resolve(tokens('fresh')));

    await expect(client.refresh()).resolves.toBe(true);

    expect(postMock).toHaveBeenCalledWith(AuthEndpoint.Refresh);
    expect(client.getStatus()).toBe(SessionStatus.Authenticated);
    expect(getRequestContext().accessToken).toBe('fresh');
  });

  it('becomes anonymous when the page loads without a valid refresh cookie', async () => {
    const { client } = setup(() => Promise.reject(rejected(ErrorReason.InvalidRefreshToken)));

    await expect(client.refresh()).resolves.toBe(false);

    expect(client.getStatus()).toBe(SessionStatus.Anonymous);
  });

  it('sends one refresh for many callers at the same time', async () => {
    const { client, postMock } = setup(() => Promise.resolve(tokens('fresh')));

    const results = await Promise.all([client.refresh(), client.refresh(), client.refresh()]);

    expect(results).toEqual([true, true, true]);
    expect(postMock).toHaveBeenCalledTimes(1);
  });

  it('holds the cross-tab lock while it refreshes', async () => {
    const held: string[] = [];
    const locks: SessionLocks = {
      request: async (name, callback) => {
        held.push(name);
        return callback();
      },
    };
    const { client } = setup(() => Promise.resolve(tokens('fresh')), locks);

    await client.refresh();

    expect(held).toEqual(['agent-ic.session-refresh']);
  });

  it('ends a signed-in session only when the server rejects the refresh token', async () => {
    const { client, postMock } = setup(() =>
      Promise.reject(rejected(null, ClientErrorCode.Network)),
    );
    client.start(tokens('current'));

    await expect(client.refresh()).resolves.toBe(false);
    expect(client.getStatus()).toBe(SessionStatus.Authenticated);

    postMock.mockRejectedValueOnce(rejected(ErrorReason.InvalidRefreshToken));
    await expect(client.refresh()).resolves.toBe(false);
    expect(client.getStatus()).toBe(SessionStatus.Anonymous);
    expect(getRequestContext().accessToken).toBeNull();
  });

  it('refreshes ahead of time only when the token is about to expire', async () => {
    const { client, postMock } = setup(() => Promise.resolve(tokens('next')));

    client.start(tokens('long-lived'));
    await client.ensureFresh();
    expect(postMock).not.toHaveBeenCalled();

    client.start(tokens('expiring', 10_000));
    await client.ensureFresh();
    expect(postMock).toHaveBeenCalledTimes(1);
    expect(client.getAccessToken()).toBe('next');
  });

  it('tells subscribers about every change and logs out through the API', async () => {
    const { client, postMock } = setup(() => Promise.resolve(null));
    const listener = vi.fn<() => void>();
    client.subscribe(listener);

    client.start(tokens('current'));
    await client.end();

    expect(postMock).toHaveBeenCalledWith(AuthEndpoint.Logout);
    expect(listener).toHaveBeenCalledTimes(2);
    expect(client.getStatus()).toBe(SessionStatus.Anonymous);
  });
});
