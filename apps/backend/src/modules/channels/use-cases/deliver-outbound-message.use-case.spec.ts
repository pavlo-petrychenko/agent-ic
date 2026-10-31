import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { ChannelStatus } from '@/modules/channels/constants/channel.constants';
import { ChannelAdapterNotFoundError } from '@/modules/channels/errors/channel-adapter-not-found.error';
import { TelegramApiError } from '@/modules/channels/errors/telegram-api.error';
import { ChannelKind, ConversationMode, MessageDelivery } from '@/modules/conversations';
import { SystemActorRequiredError } from '@/platform/context/errors/system-actor-required.error';
import { JobFailureAction } from '@/platform/errors/constants/job-failure.constants';
import { UpstreamError } from '@/platform/errors/errors/upstream.error';
import { jobFailureActionFor } from '@/platform/errors/helpers/job-failure.helpers';
import {
  AGENT_REPLY_TEXT,
  QUICK_REPLIES,
  TEST_END_USER_EXTERNAL_ID,
} from '@test/support/constants/conversations-testing.constants';
import { newChannel } from '@test/support/fixtures/channel.fixture';
import { userCtx } from '@test/support/fixtures/identity.fixture';
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

describe('DeliverOutboundMessageUseCase', () => {
  let testbed: ChannelsTestbed;

  beforeAll(async () => {
    testbed = await createChannelsTestbed();
  });

  afterAll(async () => {
    await testbed.module.close();
  });

  const seedTelegramChannel = async () => {
    const workspace = await seedChannelWorkspace(testbed);
    const agentId = testbed.ids.generate();
    const channel = newChannel(testbed, workspace.workspaceId, {
      createdByUserId: workspace.userId,
      agentId,
      status: ChannelStatus.Connected,
      externalId: testbed.ids.generate(),
      showTyping: false,
    });
    await ensureAgentRow(testbed.module, workspace.workspaceId, agentId);
    await testbed.tenants.run(workspace.workspaceId, () =>
      testbed.channels.insertIfAbsent(channel),
    );
    const conversation = await seedChannelConversation(testbed, {
      workspaceId: workspace.workspaceId,
      agentId,
      channelKind: ChannelKind.Telegram,
      channelId: channel.id,
      endUserExternalId: TEST_END_USER_EXTERNAL_ID,
    });
    return { ...workspace, channel, conversation };
  };

  const statusOf = (workspaceId: string, channelId: string) =>
    testbed.tenants.run(workspaceId, () => testbed.channels.findById(workspaceId, channelId));

  it('sends a message once when its event arrives twice', async () => {
    const conversation = await seedChannelConversation(testbed);
    const message = await queueAgentReply(testbed, conversation);

    await deliverOutbound(testbed, conversation, message);
    await deliverOutbound(testbed, conversation, message);

    expect(testbed.simulated.transcript(conversation.id)).toEqual([
      {
        messageId: message.id,
        workspaceId: conversation.workspaceId,
        conversationId: conversation.id,
        channelId: null,
        endUserExternalId: TEST_END_USER_EXTERNAL_ID,
        text: AGENT_REPLY_TEXT,
        quickReplies: QUICK_REPLIES,
      },
    ]);
    expect((await deliveryOf(testbed, message))?.delivery).toBe(MessageDelivery.Delivered);
  });

  it('marks a failed send and delivers it when the job retries', async () => {
    const conversation = await seedChannelConversation(testbed);
    const message = await queueAgentReply(testbed, conversation);
    const failure = new UpstreamError(ChannelKind.Simulated, { retryable: true });
    vi.spyOn(testbed.simulated, 'send').mockRejectedValueOnce(failure);

    await expect(deliverOutbound(testbed, conversation, message)).rejects.toBe(failure);
    expect(jobFailureActionFor(failure)).toBe(JobFailureAction.Retry);
    expect((await deliveryOf(testbed, message))?.delivery).toBe(MessageDelivery.Failed);

    await deliverOutbound(testbed, conversation, message);

    expect(testbed.simulated.transcript(conversation.id)).toHaveLength(1);
    expect((await deliveryOf(testbed, message))?.delivery).toBe(MessageDelivery.Delivered);
  });

  it('sends a simulation conversation through the simulated channel', async () => {
    const conversation = await seedChannelConversation(testbed, {
      mode: ConversationMode.Simulation,
      channelKind: ChannelKind.Telegram,
    });
    const message = await queueAgentReply(testbed, conversation);

    await deliverOutbound(testbed, conversation, message);

    expect(testbed.simulated.transcript(conversation.id)).toHaveLength(1);
  });

  it('marks a telegram channel broken when the token is revoked', async () => {
    const { workspaceId, channel, conversation } = await seedTelegramChannel();
    const message = await queueAgentReply(testbed, conversation);
    const failure = new TelegramApiError({
      method: 'sendMessage',
      status: 401,
      description: 'Unauthorized',
    });
    testbed.telegram.failNext(failure);

    await expect(deliverOutbound(testbed, conversation, message)).rejects.toBe(failure);

    expect((await deliveryOf(testbed, message))?.delivery).toBe(MessageDelivery.Failed);
    expect((await statusOf(workspaceId, channel.id))?.status).toBe(ChannelStatus.Broken);
  });

  it('keeps a telegram channel connected when the bot is blocked', async () => {
    const { workspaceId, channel, conversation } = await seedTelegramChannel();
    const message = await queueAgentReply(testbed, conversation);
    const failure = new TelegramApiError({
      method: 'sendMessage',
      status: 403,
      description: 'Forbidden: bot was blocked by the user',
    });
    testbed.telegram.failNext(failure);

    await expect(deliverOutbound(testbed, conversation, message)).rejects.toBe(failure);

    expect((await deliveryOf(testbed, message))?.delivery).toBe(MessageDelivery.Failed);
    expect((await statusOf(workspaceId, channel.id))?.status).toBe(ChannelStatus.Connected);
  });

  it('marks the message failed when no adapter serves the channel', async () => {
    const conversation = await seedChannelConversation(testbed, {
      channelKind: ChannelKind.Api,
    });
    const message = await queueAgentReply(testbed, conversation);

    await expect(deliverOutbound(testbed, conversation, message)).rejects.toBeInstanceOf(
      ChannelAdapterNotFoundError,
    );
    expect((await deliveryOf(testbed, message))?.delivery).toBe(MessageDelivery.Failed);
  });

  it('runs only as the system', async () => {
    const conversation = await seedChannelConversation(testbed);
    const message = await queueAgentReply(testbed, conversation);

    await expect(
      testbed.deliver.execute(userCtx(testbed.ids.generate()), {
        conversationId: conversation.id,
        messageId: message.id,
        channelKind: conversation.channelKind,
        mode: ConversationMode.Live,
      }),
    ).rejects.toBeInstanceOf(SystemActorRequiredError);
  });
});
