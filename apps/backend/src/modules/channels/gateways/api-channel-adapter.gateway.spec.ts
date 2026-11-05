import { ChannelKind, IdPrefix } from '@agent-ic/contracts';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { ApiChannelWebhookHeader } from '@/modules/channels/constants/api-channel-webhook.constants';
import { ApiReplyMode } from '@/modules/channels/constants/channel.constants';
import { ApiChannelWebhookMissingError } from '@/modules/channels/errors/api-channel-webhook-missing.error';
import { ApiChannelWebhookError } from '@/modules/channels/errors/api-channel-webhook.error';
import { ApiChannelAdapter } from '@/modules/channels/gateways/api-channel-adapter.gateway';
import { signApiChannelWebhook } from '@/modules/channels/helpers/api-channel-webhook.helpers';
import { MessageDelivery } from '@/modules/conversations';
import { JobFailureAction } from '@/platform/errors/constants/job-failure.constants';
import { jobFailureActionFor } from '@/platform/errors/helpers/job-failure.helpers';
import { OutboundHttpOutcome } from '@/platform/outbound-http/constants/outbound-http.constants';
import {
  AGENT_REPLY_TEXT,
  QUICK_REPLIES,
  TEST_END_USER_EXTERNAL_ID,
} from '@test/support/constants/conversations-testing.constants';
import {
  createChannelsTestbed,
  deliverOutbound,
  deliveryOf,
  queueAgentReply,
  seedApiChannel,
  seedChannelConversation,
} from '@test/support/helpers/channels-testing.helpers';
import type { ChannelsTestbed } from '@test/support/typedefs/channels-testing.typedefs';

const WEBHOOK = 'https://shop.example/hooks/agent';

describe('ApiChannelAdapter', () => {
  let testbed: ChannelsTestbed;

  beforeAll(async () => {
    testbed = await createChannelsTestbed();
  });

  afterAll(async () => {
    await testbed.module.close();
  });

  beforeEach(() => {
    testbed.outbound.requests.length = 0;
    testbed.outbound.respond(204, '');
  });

  const seed = async (webhook: string | null = WEBHOOK) => {
    const seeded = await seedApiChannel(testbed, {
      identity: { name: 'Website', replyMode: ApiReplyMode.Webhook, webhook },
    });
    const conversation = await seedChannelConversation(testbed, {
      workspaceId: seeded.workspaceId,
      agentId: seeded.agentId,
      channelKind: ChannelKind.Api,
      channelId: seeded.channel.id,
      endUserExternalId: TEST_END_USER_EXTERNAL_ID,
    });
    return { ...seeded, conversation };
  };

  it('posts a signed payload to the channel webhook and marks it delivered', async () => {
    const seeded = await seed();
    const message = await queueAgentReply(testbed, seeded.conversation);

    await deliverOutbound(testbed, seeded.conversation, message);

    expect(testbed.outbound.requests).toHaveLength(1);
    const request = testbed.outbound.requests[0];
    if (request === undefined) {
      throw new Error('Expected a webhook request');
    }
    const body = request.body ?? '';
    const publicMessageId = testbed.ids.toPublic(IdPrefix.Message, message.id);
    expect(request).toMatchObject({ method: 'POST', url: WEBHOOK });
    expect(JSON.parse(body)).toEqual({
      conversation_id: testbed.ids.toPublic(IdPrefix.Conversation, seeded.conversation.id),
      message_id: publicMessageId,
      user_id: TEST_END_USER_EXTERNAL_ID,
      text: AGENT_REPLY_TEXT,
      quick_replies: QUICK_REPLIES,
    });
    const timestamp = request.headers[ApiChannelWebhookHeader.Timestamp];
    expect(timestamp).toEqual(expect.any(String));
    expect(request.headers[ApiChannelWebhookHeader.Signature]).toBe(
      signApiChannelWebhook('old-webhook-secret', timestamp ?? '', body),
    );
    expect(request.headers[ApiChannelWebhookHeader.Delivery]).toBe(publicMessageId);
    expect((await deliveryOf(testbed, message))?.delivery).toBe(MessageDelivery.Delivered);
  });

  it('marks a webhook rejection as failed and retries a 500', async () => {
    testbed.outbound.respond(500, '');
    const seeded = await seed();
    const message = await queueAgentReply(testbed, seeded.conversation);

    const error = await deliverOutbound(testbed, seeded.conversation, message).catch(
      (caught: unknown) => caught,
    );

    expect(error).toBeInstanceOf(ApiChannelWebhookError);
    expect(jobFailureActionFor(error)).toBe(JobFailureAction.Retry);
    expect((await deliveryOf(testbed, message))?.delivery).toBe(MessageDelivery.Failed);
  });

  it('gives up on a permanent webhook rejection', async () => {
    testbed.outbound.respond(400, '');
    const seeded = await seed();
    const message = await queueAgentReply(testbed, seeded.conversation);

    const error = await deliverOutbound(testbed, seeded.conversation, message).catch(
      (caught: unknown) => caught,
    );

    expect(error).toBeInstanceOf(ApiChannelWebhookError);
    expect(jobFailureActionFor(error)).toBe(JobFailureAction.GiveUp);
  });

  it('fails when the API channel has no webhook', async () => {
    const seeded = await seed(null);
    const message = await queueAgentReply(testbed, seeded.conversation);

    const error = await deliverOutbound(testbed, seeded.conversation, message).catch(
      (caught: unknown) => caught,
    );

    expect(error).toBeInstanceOf(ApiChannelWebhookMissingError);
    expect(jobFailureActionFor(error)).toBe(JobFailureAction.GiveUp);
    expect(testbed.outbound.requests).toHaveLength(0);
    expect((await deliveryOf(testbed, message))?.delivery).toBe(MessageDelivery.Failed);
  });

  it('does not mark the channel broken for a webhook failure', () => {
    const adapter = testbed.module.get(ApiChannelAdapter);

    expect(
      adapter.isChannelBroken(new ApiChannelWebhookError(OutboundHttpOutcome.Responded, 500)),
    ).toBe(false);
  });
});
