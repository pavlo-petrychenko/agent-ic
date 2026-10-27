import { ChannelKind, IdPrefix, WorkspaceRole } from '@agent-ic/contracts';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { ChannelStatus } from '@/modules/channels/constants/channel.constants';
import { TelegramApiError } from '@/modules/channels/errors/telegram-api.error';
import { DisconnectTelegramUseCase } from '@/modules/channels/use-cases/disconnect-telegram.use-case';
import { PermissionDeniedError } from '@/platform/context/errors/permission-denied.error';
import { TEST_TELEGRAM_TOKEN } from '@test/support/constants/channel-testing.constants';
import { newChannel } from '@test/support/fixtures/channel.fixture';
import { workspaceCtx } from '@test/support/fixtures/workspace.fixture';
import {
  createChannelsTestbed,
  seedChannelWorkspace,
} from '@test/support/helpers/channels-testing.helpers';
import type { ChannelsTestbed } from '@test/support/typedefs/channels-testing.typedefs';

describe('DisconnectTelegramUseCase', () => {
  let testbed: ChannelsTestbed;
  let disconnect: DisconnectTelegramUseCase;

  beforeAll(async () => {
    testbed = await createChannelsTestbed();
    disconnect = testbed.module.get(DisconnectTelegramUseCase);
  });

  afterAll(async () => {
    await testbed.module.close();
  });

  beforeEach(() => {
    testbed.telegram.deleteWebhookCalls.length = 0;
  });

  const seedConnected = async () => {
    const workspace = await seedChannelWorkspace(testbed);
    const channel = newChannel(testbed, workspace.workspaceId, {
      createdByUserId: workspace.userId,
      status: ChannelStatus.Connected,
      credentialsSealed: testbed.channelTokens.sealCredentials({
        botToken: TEST_TELEGRAM_TOKEN,
        webhookSecretHash: 'webhook-secret-hash',
      }),
    });
    await testbed.tenants.run(workspace.workspaceId, () =>
      testbed.channels.insertIfAbsent(channel),
    );
    return {
      ...workspace,
      channel,
      ctx: workspaceCtx(workspace.userId, workspace.workspaceId, WorkspaceRole.Owner),
    };
  };

  it('removes the Telegram webhook and marks the channel disconnected', async () => {
    const { channel, ctx, workspaceId } = await seedConnected();

    const view = await disconnect.execute(ctx, {
      id: testbed.ids.toPublic(IdPrefix.Channel, channel.id),
    });

    expect(view).toMatchObject({
      id: testbed.ids.toPublic(IdPrefix.Channel, channel.id),
      kind: ChannelKind.Telegram,
      status: ChannelStatus.Disconnected,
    });
    expect(testbed.telegram.deleteWebhookCalls).toEqual([TEST_TELEGRAM_TOKEN]);
    const stored = await testbed.tenants.run(workspaceId, () =>
      testbed.channels.findById(workspaceId, channel.id),
    );
    expect(stored?.status).toBe(ChannelStatus.Disconnected);
  });

  it('is idempotent for an already disconnected channel', async () => {
    const { channel, ctx, workspaceId } = await seedConnected();
    const id = testbed.ids.toPublic(IdPrefix.Channel, channel.id);

    await disconnect.execute(ctx, { id });
    await disconnect.execute(ctx, { id });

    expect(testbed.telegram.deleteWebhookCalls).toHaveLength(1);
    const stored = await testbed.tenants.run(workspaceId, () =>
      testbed.channels.findById(workspaceId, channel.id),
    );
    expect(stored?.status).toBe(ChannelStatus.Disconnected);
  });

  it('treats a revoked token as disconnected', async () => {
    const { channel, ctx } = await seedConnected();
    testbed.telegram.failNext(
      new TelegramApiError({
        method: 'deleteWebhook',
        status: 401,
        description: 'Unauthorized',
      }),
    );

    const view = await disconnect.execute(ctx, {
      id: testbed.ids.toPublic(IdPrefix.Channel, channel.id),
    });

    expect(view.status).toBe(ChannelStatus.Disconnected);
  });

  it('keeps the channel connected when Telegram returns a retryable error', async () => {
    const { channel, ctx, workspaceId } = await seedConnected();
    testbed.telegram.failNext(
      new TelegramApiError({
        method: 'deleteWebhook',
        status: 500,
        description: 'Server error',
        retryable: true,
      }),
    );

    await expect(
      disconnect.execute(ctx, { id: testbed.ids.toPublic(IdPrefix.Channel, channel.id) }),
    ).rejects.toBeInstanceOf(TelegramApiError);

    const stored = await testbed.tenants.run(workspaceId, () =>
      testbed.channels.findById(workspaceId, channel.id),
    );
    expect(stored?.status).toBe(ChannelStatus.Connected);
  });

  it('refuses an operator', async () => {
    const { channel, workspaceId, userId } = await seedConnected();

    await expect(
      disconnect.execute(workspaceCtx(userId, workspaceId, WorkspaceRole.Operator), {
        id: testbed.ids.toPublic(IdPrefix.Channel, channel.id),
      }),
    ).rejects.toBeInstanceOf(PermissionDeniedError);
    expect(testbed.telegram.deleteWebhookCalls).toHaveLength(0);
  });
});
