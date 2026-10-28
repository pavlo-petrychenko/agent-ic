import { ChannelKind } from '@agent-ic/contracts';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { ChannelStatus } from '@/modules/channels/constants/channel.constants';
import { TelegramChatAction } from '@/modules/channels/constants/telegram.constants';
import { ChannelNotFoundError } from '@/modules/channels/errors/channel-not-found.error';
import { TelegramChannelAdapter } from '@/modules/channels/gateways/telegram-channel-adapter.gateway';
import type { ChannelOutboundMessage } from '@/modules/channels/typedefs/channel-message.typedefs';
import { MessageDelivery } from '@/modules/conversations';
import { RateLimitedError } from '@/platform/rate-limit/errors/rate-limited.error';
import { TEST_TELEGRAM_TOKEN } from '@test/support/constants/channel-testing.constants';
import {
  AGENT_REPLY_TEXT,
  TEST_END_USER_EXTERNAL_ID,
} from '@test/support/constants/conversations-testing.constants';
import { newChannel } from '@test/support/fixtures/channel.fixture';
import {
  createChannelsTestbed,
  deliverOutbound,
  deliveryOf,
  queueAgentReply,
  seedChannelConversation,
  seedChannelWorkspace,
} from '@test/support/helpers/channels-testing.helpers';
import { ensureAgentRow } from '@test/support/helpers/parent-rows.helpers';
import type { ChannelsTestbed } from '@test/support/typedefs/channels-testing.typedefs';

const seedTelegramChannel = async (
  testbed: ChannelsTestbed,
  overrides: { readonly showTyping?: boolean } = {},
) => {
  const workspace = await seedChannelWorkspace(testbed);
  const agentId = testbed.ids.generate();
  const channel = newChannel(testbed, workspace.workspaceId, {
    createdByUserId: workspace.userId,
    status: ChannelStatus.Connected,
    agentId,
    externalId: testbed.ids.generate(),
    showTyping: overrides.showTyping ?? true,
  });
  await ensureAgentRow(testbed.module, workspace.workspaceId, agentId);
  await testbed.tenants.run(workspace.workspaceId, () => testbed.channels.insertIfAbsent(channel));
  const conversation = await seedChannelConversation(testbed, {
    workspaceId: workspace.workspaceId,
    agentId,
    channelKind: ChannelKind.Telegram,
    channelId: channel.id,
    endUserExternalId: TEST_END_USER_EXTERNAL_ID,
  });
  return { workspace, channel, conversation };
};

const outboundFor = (
  workspaceId: string,
  channelId: string,
  conversationId: string,
): ChannelOutboundMessage => ({
  messageId: 'message-1',
  workspaceId,
  conversationId,
  channelId,
  endUserExternalId: TEST_END_USER_EXTERNAL_ID,
  text: AGENT_REPLY_TEXT,
  quickReplies: [],
});

describe('TelegramChannelAdapter', () => {
  let testbed: ChannelsTestbed;

  beforeAll(async () => {
    testbed = await createChannelsTestbed();
  });

  afterAll(async () => {
    await testbed.module.close();
  });

  beforeEach(() => {
    testbed.telegram.sendMessageCalls.length = 0;
    testbed.telegram.sendChatActionCalls.length = 0;
  });

  it('sends the text with typing to the Telegram chat', async () => {
    const { conversation } = await seedTelegramChannel(testbed);
    const message = await queueAgentReply(testbed, conversation);

    await deliverOutbound(testbed, conversation, message);

    expect(testbed.telegram.sendChatActionCalls).toEqual([
      {
        token: TEST_TELEGRAM_TOKEN,
        chatId: TEST_END_USER_EXTERNAL_ID,
        action: TelegramChatAction.Typing,
      },
    ]);
    expect(testbed.telegram.sendMessageCalls).toEqual([
      {
        token: TEST_TELEGRAM_TOKEN,
        chatId: TEST_END_USER_EXTERNAL_ID,
        text: AGENT_REPLY_TEXT,
        quickReplies: [],
      },
    ]);
    expect((await deliveryOf(testbed, message))?.delivery).toBe(MessageDelivery.Delivered);
    expect(testbed.telegram.deleteWebhookCalls).toHaveLength(0);
  });

  it('does not send typing when the channel turns it off', async () => {
    const { conversation } = await seedTelegramChannel(testbed, { showTyping: false });
    const message = await queueAgentReply(testbed, conversation);

    await deliverOutbound(testbed, conversation, message);

    expect(testbed.telegram.sendChatActionCalls).toHaveLength(0);
    expect(testbed.telegram.sendMessageCalls).toHaveLength(1);
  });

  it('fails when the conversation has no channel row', async () => {
    const workspace = await seedChannelWorkspace(testbed);
    const conversation = await seedChannelConversation(testbed, {
      workspaceId: workspace.workspaceId,
      channelKind: ChannelKind.Telegram,
      channelId: testbed.ids.generate(),
    });
    const message = await queueAgentReply(testbed, conversation);

    await expect(deliverOutbound(testbed, conversation, message)).rejects.toBeInstanceOf(
      ChannelNotFoundError,
    );

    expect(testbed.telegram.sendMessageCalls).toHaveLength(0);
    expect((await deliveryOf(testbed, message))?.delivery).toBe(MessageDelivery.Failed);
  });

  it('stops a second message to the same chat within a second', async () => {
    const { workspace, channel, conversation } = await seedTelegramChannel(testbed);
    const adapter = testbed.module.get(TelegramChannelAdapter);
    const outbound = outboundFor(workspace.workspaceId, channel.id, conversation.id);

    await adapter.send(outbound);

    await expect(adapter.send(outbound)).rejects.toBeInstanceOf(RateLimitedError);
    expect(testbed.telegram.sendMessageCalls).toHaveLength(1);
  });
});
