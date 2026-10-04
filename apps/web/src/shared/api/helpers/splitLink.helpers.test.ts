import { gql } from '@apollo/client';
import type { ClientOptions } from 'graphql-ws';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createSessionClient } from '@/shared/api/clients/session.client';
import { setAccessToken, setWorkspaceId } from '@/shared/api/helpers/requestContext.helpers';
import {
  buildConnectionParams,
  buildWebSocketUrl,
  createWsClient,
  isSubscriptionOperation,
} from '@/shared/api/helpers/splitLink.helpers';
import type { AuthRequest } from '@/shared/api/typedefs/session.typedefs';

const ws = vi.hoisted(() => ({
  terminate: vi.fn<() => void>(),
  options: { current: null as ClientOptions | null },
}));

vi.mock('graphql-ws', () => ({
  createClient: (options: ClientOptions) => {
    ws.options.current = options;
    return { terminate: ws.terminate };
  },
}));

const PATH = '/api/graphql';
const HOST = 'app.example.com';
const URL = `wss://${HOST}${PATH}`;
const NOW = Date.parse('2026-10-04T12:00:00.000Z');
const tokens = (accessToken: string, expiresInMs = 15 * 60_000) => ({
  accessToken,
  accessTokenExpiresAt: new Date(NOW + expiresInMs).toISOString(),
});

const connect = async (): Promise<unknown> => {
  const params = ws.options.current?.connectionParams;
  return typeof params === 'function' ? params() : params;
};

describe('buildWebSocketUrl', () => {
  it('uses wss when the page is served over https', () => {
    expect(buildWebSocketUrl(PATH, { protocol: 'https:', host: HOST })).toBe(URL);
  });

  it('uses ws when the page is served over http', () => {
    expect(buildWebSocketUrl(PATH, { protocol: 'http:', host: HOST })).toBe(`ws://${HOST}${PATH}`);
  });
});

describe('isSubscriptionOperation', () => {
  it('is true only for subscriptions', () => {
    const subscription = gql`
      subscription Changed {
        changed
      }
    `;
    const query = gql`
      query Read {
        read
      }
    `;
    expect(isSubscriptionOperation(subscription)).toBe(true);
    expect(isSubscriptionOperation(query)).toBe(false);
  });
});

describe('buildConnectionParams', () => {
  it('sends the bearer token and the workspace id in connection_init', () => {
    expect(buildConnectionParams({ accessToken: 'token-1', workspaceId: 'ws_1' })).toEqual({
      authorization: 'Bearer token-1',
      'x-workspace-id': 'ws_1',
    });
    expect(buildConnectionParams({ accessToken: null, workspaceId: null })).toEqual({});
  });
});

describe('createWsClient', () => {
  afterEach(() => {
    setAccessToken(null);
    setWorkspaceId(null);
    ws.terminate.mockClear();
  });

  const setup = (post: AuthRequest) => {
    const session = createSessionClient({ post, locks: null, now: () => NOW });
    createWsClient(URL, session);
    return session;
  };

  it('reconnects with the new token after the session changes it', async () => {
    const session = setup(() => Promise.resolve(null));
    session.start(tokens('first'));
    await expect(connect()).resolves.toEqual({ authorization: 'Bearer first' });

    session.start(tokens('second'));
    expect(ws.terminate).toHaveBeenCalledTimes(1);
    await expect(connect()).resolves.toEqual({ authorization: 'Bearer second' });

    session.start(tokens('second'));
    expect(ws.terminate).toHaveBeenCalledTimes(1);
  });

  it('refreshes an expiring token before it connects', async () => {
    const session = setup(() => Promise.resolve(tokens('renewed')));
    session.start(tokens('expiring', 1_000));

    await expect(connect()).resolves.toEqual({ authorization: 'Bearer renewed' });
  });

  it('reconnects with the new workspace id after the active workspace changes', async () => {
    const session = setup(() => Promise.resolve(null));
    session.start(tokens('token'));
    setWorkspaceId('ws_1');
    await expect(connect()).resolves.toEqual({
      authorization: 'Bearer token',
      'x-workspace-id': 'ws_1',
    });
    ws.terminate.mockClear();

    setWorkspaceId('ws_2');
    expect(ws.terminate).toHaveBeenCalled();
    await expect(connect()).resolves.toEqual({
      authorization: 'Bearer token',
      'x-workspace-id': 'ws_2',
    });
    ws.terminate.mockClear();

    setWorkspaceId('ws_2');
    expect(ws.terminate).not.toHaveBeenCalled();
  });
});
