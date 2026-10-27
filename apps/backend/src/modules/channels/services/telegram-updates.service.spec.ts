import { WorkspaceRole } from '@agent-ic/contracts';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { ChannelStatus } from '@/modules/channels/constants/channel.constants';
import { TelegramUpdatesService } from '@/modules/channels/services/telegram-updates.service';
import type {
  TelegramMessage,
  TelegramUpdate,
} from '@/modules/channels/typedefs/telegram.typedefs';
import { IncomingMessageOutcome, MessageAuthor } from '@/modules/conversations';
import { SystemActorRequiredError } from '@/platform/context/errors/system-actor-required.error';
import { newChannel } from '@test/support/fixtures/channel.fixture';
import { workspaceSystemCtx } from '@test/support/fixtures/conversation.fixture';
import { workspaceCtx } from '@test/support/fixtures/workspace.fixture';
import {
  createChannelsTestbed,
  seedChannelWorkspace,
} from '@test/support/helpers/channels-testing.helpers';
import { seedAgent } from '@test/support/helpers/conversations-testing.helpers';
import type { ChannelsTestbed } from '@test/support/typedefs/channels-testing.typedefs';

const UPDATE_ID = '1000';
const MESSAGE_ID = '5';

const telegramUpdate = (overrides: Partial<TelegramMessage> = {}): TelegramUpdate => ({
  updateId: UPDATE_ID,
  message: {
    messageId: MESSAGE_ID,
    sentAt: new Date('2026-10-27T10:00:00.000Z'),
    chatId: '42',
    senderId: '900',
    senderName: 'Moshe',
    text: 'Hello',
    ...overrides,
  },
});

describe('TelegramUpdatesService', () => {
  let testbed: ChannelsTestbed;
  let updates: TelegramUpdatesService;

  beforeAll(async () => {
    testbed = await createChannelsTestbed();
    updates = testbed.module.get(TelegramUpdatesService);
  });

  afterAll(async () => {
    await testbed.module.close();
  });

  const seed = async (status: ChannelStatus = ChannelStatus.Connected) => {
    const workspace = await seedChannelWorkspace(testbed);
    const agentId = await seedAgent(testbed, workspace.workspaceId);
    const channel = newChannel(testbed, workspace.workspaceId, {
      createdByUserId: workspace.userId,
      agentId,
      status,
      externalId: testbed.ids.generate(),
    });
    await testbed.tenants.run(workspace.workspaceId, () =>
      testbed.channels.insertIfAbsent(channel),
    );
    return {
      ...workspace,
      agentId,
      channel,
      ctx: workspaceSystemCtx(workspace.workspaceId),
    };
  };

  it('stores the message and requests a run', async () => {
    const { channel, ctx, workspaceId } = await seed();

    const result = await updates.handleTelegramUpdate(ctx, {
      channelId: channel.id,
      update: telegramUpdate(),
    });

    if (result === null) {
      throw new Error('Expected a received message');
    }
    expect(result.outcome).toBe(IncomingMessageOutcome.RunRequested);
    const stored = await testbed.tenants.run(workspaceId, () =>
      testbed.messages.findByExternalId(workspaceId, result.conversationId, MESSAGE_ID),
    );
    expect(stored).toMatchObject({
      conversationId: result.conversationId,
      author: MessageAuthor.Customer,
      text: 'Hello',
    });
  });

  it('ignores an update that was already received', async () => {
    const { channel, ctx } = await seed();

    await updates.handleTelegramUpdate(ctx, { channelId: channel.id, update: telegramUpdate() });

    await expect(
      updates.handleTelegramUpdate(ctx, { channelId: channel.id, update: telegramUpdate() }),
    ).resolves.toBeNull();
  });

  it('ignores a channel that is not connected', async () => {
    const { channel, ctx } = await seed(ChannelStatus.Pending);

    await expect(
      updates.handleTelegramUpdate(ctx, { channelId: channel.id, update: telegramUpdate() }),
    ).resolves.toBeNull();
  });

  it('ignores an update without a message', async () => {
    const { channel, ctx } = await seed();

    await expect(
      updates.handleTelegramUpdate(ctx, {
        channelId: channel.id,
        update: { updateId: '1001', message: null },
      }),
    ).resolves.toBeNull();
  });

  it('ignores a channel from another workspace', async () => {
    const first = await seed();
    const second = await seed();

    await expect(
      updates.handleTelegramUpdate(first.ctx, {
        channelId: second.channel.id,
        update: telegramUpdate(),
      }),
    ).resolves.toBeNull();
  });

  it('ignores a channel whose agent is gone', async () => {
    const { workspaceId, userId } = await seedChannelWorkspace(testbed);
    const channel = newChannel(testbed, workspaceId, {
      createdByUserId: userId,
      agentId: null,
      status: ChannelStatus.Connected,
      externalId: testbed.ids.generate(),
    });
    await testbed.tenants.run(workspaceId, () => testbed.channels.insertIfAbsent(channel));

    await expect(
      updates.handleTelegramUpdate(workspaceSystemCtx(workspaceId), {
        channelId: channel.id,
        update: telegramUpdate(),
      }),
    ).resolves.toBeNull();
  });

  it('refuses a user actor', async () => {
    const { channel, workspaceId, userId } = await seed();

    await expect(
      updates.handleTelegramUpdate(workspaceCtx(userId, workspaceId, WorkspaceRole.Owner), {
        channelId: channel.id,
        update: telegramUpdate(),
      }),
    ).rejects.toBeInstanceOf(SystemActorRequiredError);
  });
});
