import { describe, expect, it, vi } from 'vitest';
import {
  API_CHANNEL_CLIENT_MESSAGE_RATE_LIMIT,
  API_CHANNEL_MESSAGE_RATE_LIMIT,
  API_CHANNEL_WORKSPACE_MESSAGE_RATE_LIMIT,
} from '@/modules/channels/constants/api-channel-rate-limit.constants';
import { ApiChannelRateLimiterService } from '@/modules/channels/services/api-channel-rate-limiter.service';
import { systemCtx } from '@test/support/fixtures/identity.fixture';

describe('ApiChannelRateLimiterService', () => {
  const ctx = {
    ...systemCtx(),
    workspaceId: 'workspace',
    clientIp: '203.0.113.10',
  };

  it('enforces the workspace, client and channel buckets in order', async () => {
    const enforce = vi.fn<() => Promise<void>>(() => Promise.resolve());
    const limiter = new ApiChannelRateLimiterService({ enforce } as never);

    await limiter.enforce(ctx, 'workspace', 'channel');

    expect(enforce.mock.calls).toEqual([
      [API_CHANNEL_WORKSPACE_MESSAGE_RATE_LIMIT, 'workspace'],
      [API_CHANNEL_CLIENT_MESSAGE_RATE_LIMIT, '203.0.113.10'],
      [API_CHANNEL_MESSAGE_RATE_LIMIT, 'channel'],
    ]);
  });

  it('skips the client bucket when the request has no client ip', async () => {
    const enforce = vi.fn<() => Promise<void>>(() => Promise.resolve());
    const limiter = new ApiChannelRateLimiterService({ enforce } as never);

    await limiter.enforce({ ...ctx, clientIp: null }, 'workspace', 'channel');

    expect(enforce.mock.calls).toEqual([
      [API_CHANNEL_WORKSPACE_MESSAGE_RATE_LIMIT, 'workspace'],
      [API_CHANNEL_MESSAGE_RATE_LIMIT, 'channel'],
    ]);
  });
});
