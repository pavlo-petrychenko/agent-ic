import { ChannelKind, IdPrefix, WorkspaceRole } from '@agent-ic/contracts';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { ChannelStatus } from '@/modules/channels/constants/channel.constants';
import { ChannelNotFoundError } from '@/modules/channels/errors/channel-not-found.error';
import { TelegramApiError } from '@/modules/channels/errors/telegram-api.error';
import { DeleteChannelUseCase } from '@/modules/channels/use-cases/delete-channel.use-case';
import { PermissionDeniedError } from '@/platform/context/errors/permission-denied.error';
import { TEST_TELEGRAM_TOKEN } from '@test/support/constants/channel-testing.constants';
import { newChannel, newChannelEvent } from '@test/support/fixtures/channel.fixture';
import { newConversation } from '@test/support/fixtures/conversation.fixture';
import { workspaceCtx } from '@test/support/fixtures/workspace.fixture';
import { channelEventsFor } from '@test/support/helpers/channel-events.helpers';
import {
  createChannelsTestbed,
  seedChannelWorkspace,
} from '@test/support/helpers/channels-testing.helpers';
import { seedAgent } from '@test/support/helpers/conversations-testing.helpers';
import type { ChannelsTestbed } from '@test/support/typedefs/channels-testing.typedefs';

describe('DeleteChannelUseCase', () => {
  let testbed: ChannelsTestbed;
  let deleteChannel: DeleteChannelUseCase;

  beforeAll(async () => {
    testbed = await createChannelsTestbed();
    deleteChannel = testbed.module.get(DeleteChannelUseCase);
  });

  afterAll(async () => {
    await testbed.module.close();
  });

  beforeEach(() => {
    testbed.telegram.deleteWebhookCalls.length = 0;
  });

  const seed = async (status: ChannelStatus = ChannelStatus.Disconnected) => {
    const workspace = await seedChannelWorkspace(testbed);
    const channel = newChannel(testbed, workspace.workspaceId, {
      createdByUserId: workspace.userId,
      status,
      externalId: testbed.ids.generate(),
    });
    await testbed.tenants.run(workspace.workspaceId, () =>
      testbed.channels.insertIfAbsent(channel),
    );
    return {
      ...workspace,
      channel,
      publicId: testbed.ids.toPublic(IdPrefix.Channel, channel.id),
      ctx: workspaceCtx(workspace.userId, workspace.workspaceId, WorkspaceRole.Owner),
    };
  };

  it('deletes a disconnected channel without touching Telegram', async () => {
    const { channel, ctx, publicId, workspaceId } = await seed();

    await expect(deleteChannel.execute(ctx, { id: publicId })).resolves.toBe(true);

    expect(testbed.telegram.deleteWebhookCalls).toHaveLength(0);
    const stored = await testbed.tenants.run(workspaceId, () =>
      testbed.channels.findById(workspaceId, channel.id),
    );
    expect(stored).toBeNull();
  });

  it('removes the webhook before deleting a connected channel', async () => {
    const { channel, ctx, publicId, workspaceId } = await seed(ChannelStatus.Connected);

    await expect(deleteChannel.execute(ctx, { id: publicId })).resolves.toBe(true);

    expect(testbed.telegram.deleteWebhookCalls).toEqual([TEST_TELEGRAM_TOKEN]);
    const stored = await testbed.tenants.run(workspaceId, () =>
      testbed.channels.findById(workspaceId, channel.id),
    );
    expect(stored).toBeNull();
  });

  it('deletes a channel whose token was already revoked', async () => {
    const { channel, ctx, publicId, workspaceId } = await seed(ChannelStatus.Connected);
    testbed.telegram.failNext(
      new TelegramApiError({ method: 'deleteWebhook', status: 401, description: 'Unauthorized' }),
    );

    await expect(deleteChannel.execute(ctx, { id: publicId })).resolves.toBe(true);

    const stored = await testbed.tenants.run(workspaceId, () =>
      testbed.channels.findById(workspaceId, channel.id),
    );
    expect(stored).toBeNull();
  });

  it('keeps the channel when Telegram returns a retryable error', async () => {
    const { channel, ctx, publicId, workspaceId } = await seed(ChannelStatus.Connected);
    testbed.telegram.failNext(
      new TelegramApiError({ method: 'deleteWebhook', status: 500, retryable: true }),
    );

    await expect(deleteChannel.execute(ctx, { id: publicId })).rejects.toBeInstanceOf(
      TelegramApiError,
    );

    const stored = await testbed.tenants.run(workspaceId, () =>
      testbed.channels.findById(workspaceId, channel.id),
    );
    expect(stored).not.toBeNull();
  });

  it('keeps the conversations and removes the channel events', async () => {
    const { channel, ctx, publicId, workspaceId } = await seed();
    const agentId = await seedAgent(testbed, workspaceId);
    const conversation = await testbed.tenants.run(workspaceId, () =>
      testbed.conversations.insert({
        ...newConversation(testbed, workspaceId),
        agentId,
        channelKind: ChannelKind.Telegram,
        channelId: channel.id,
      }),
    );
    await testbed.tenants.run(workspaceId, () =>
      testbed.channelEvents.insertIfAbsent(
        newChannelEvent(testbed, channel, { externalId: 'update-1' }),
      ),
    );

    await deleteChannel.execute(ctx, { id: publicId });

    const kept = await testbed.tenants.run(workspaceId, () =>
      testbed.conversations.findById(workspaceId, conversation.id),
    );
    expect(kept?.channelId).toBe(channel.id);
    await expect(channelEventsFor(testbed.module, channel.id)).resolves.toEqual([]);
  });

  it('frees the bot id so it can be connected again', async () => {
    const { channel, ctx, publicId, userId, workspaceId } = await seed();

    await deleteChannel.execute(ctx, { id: publicId });

    const again = newChannel(testbed, workspaceId, {
      createdByUserId: userId,
      externalId: channel.externalId,
    });
    const inserted = await testbed.tenants.run(workspaceId, () =>
      testbed.channels.insertIfAbsent(again),
    );
    expect(inserted).toBe(true);
  });

  it('refuses a channel from another workspace', async () => {
    const { ctx } = await seed();
    const other = await seed();

    await expect(deleteChannel.execute(ctx, { id: other.publicId })).rejects.toBeInstanceOf(
      ChannelNotFoundError,
    );
    expect(testbed.telegram.deleteWebhookCalls).toHaveLength(0);
  });

  it('refuses an unknown channel', async () => {
    const { ctx } = await seed();

    await expect(
      deleteChannel.execute(ctx, {
        id: testbed.ids.toPublic(IdPrefix.Channel, testbed.ids.generate()),
      }),
    ).rejects.toBeInstanceOf(ChannelNotFoundError);
  });

  it('refuses an operator', async () => {
    const { channel, workspaceId, userId } = await seed();

    await expect(
      deleteChannel.execute(workspaceCtx(userId, workspaceId, WorkspaceRole.Operator), {
        id: testbed.ids.toPublic(IdPrefix.Channel, channel.id),
      }),
    ).rejects.toBeInstanceOf(PermissionDeniedError);
    const stored = await testbed.tenants.run(workspaceId, () =>
      testbed.channels.findById(workspaceId, channel.id),
    );
    expect(stored).not.toBeNull();
  });
});
