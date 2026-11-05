import { IdPrefix } from '@agent-ic/contracts';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { ChannelStatus } from '@/modules/channels/constants/channel.constants';
import { ChannelNotFoundError } from '@/modules/channels/errors/channel-not-found.error';
import { InvalidChannelInputError } from '@/modules/channels/errors/invalid-channel-input.error';
import { HandleApiChannelMessageUseCase } from '@/modules/channels/use-cases/handle-api-channel-message.use-case';
import { MessageAuthor } from '@/modules/conversations';
import { SystemReason } from '@/platform/context/constants/actor.constants';
import { AuthenticationRequiredError } from '@/platform/context/errors/authentication-required.error';
import { UseCaseCtxService } from '@/platform/context/services/use-case-ctx.service';
import {
  createChannelsTestbed,
  seedApiChannel,
} from '@test/support/helpers/channels-testing.helpers';
import type { ChannelsTestbed } from '@test/support/typedefs/channels-testing.typedefs';

const TRACE_ID = 'api-message-trace';

describe('HandleApiChannelMessageUseCase', () => {
  let testbed: ChannelsTestbed;
  let handle: HandleApiChannelMessageUseCase;
  let contexts: UseCaseCtxService;

  beforeAll(async () => {
    testbed = await createChannelsTestbed();
    handle = testbed.module.get(HandleApiChannelMessageUseCase);
    contexts = testbed.module.get(UseCaseCtxService);
  });

  afterAll(async () => {
    await testbed.module.close();
  });

  const apiCtx = (seeded: Awaited<ReturnType<typeof seedApiChannel>>) =>
    contexts.apiChannel({
      channelId: seeded.channel.id,
      workspaceId: seeded.workspaceId,
      traceId: TRACE_ID,
      clientIp: null,
    });

  const internalConversationId = (publicId: string): string =>
    testbed.ids.fromPublic(IdPrefix.Conversation, publicId);

  it('creates a conversation and a customer message', async () => {
    const seeded = await seedApiChannel(testbed);

    const result = await handle.execute(apiCtx(seeded), {
      body: { user_id: 'cust_1', text: 'Do you ship to Poland?' },
      idempotencyKey: null,
    });

    const messages = await testbed.tenants.run(seeded.workspaceId, () =>
      testbed.messages.listByConversation(
        seeded.workspaceId,
        internalConversationId(result.conversationId),
      ),
    );
    expect(result.conversationId).toMatch(/^cnv_/);
    expect(messages).toHaveLength(1);
    expect(messages[0]).toMatchObject({
      text: 'Do you ship to Poland?',
      author: MessageAuthor.Customer,
    });
  });

  it('continues the conversation for the same user', async () => {
    const seeded = await seedApiChannel(testbed);
    const ctx = apiCtx(seeded);

    const first = await handle.execute(ctx, {
      body: { user_id: 'cust_1', text: 'Hello' },
      idempotencyKey: null,
    });
    const second = await handle.execute(ctx, {
      body: { user_id: 'cust_1', text: 'Again' },
      idempotencyKey: null,
    });

    expect(second.conversationId).toBe(first.conversationId);
    const messages = await testbed.tenants.run(seeded.workspaceId, () =>
      testbed.messages.listByConversation(
        seeded.workspaceId,
        internalConversationId(first.conversationId),
      ),
    );
    expect(messages).toHaveLength(2);
  });

  it('starts a new conversation for another user', async () => {
    const seeded = await seedApiChannel(testbed);
    const ctx = apiCtx(seeded);

    const first = await handle.execute(ctx, {
      body: { user_id: 'cust_1', text: 'Hello' },
      idempotencyKey: null,
    });
    const second = await handle.execute(ctx, {
      body: { user_id: 'cust_2', text: 'Hello' },
      idempotencyKey: null,
    });

    expect(second.conversationId).not.toBe(first.conversationId);
  });

  it('does not duplicate a retried request with the same idempotency key', async () => {
    const seeded = await seedApiChannel(testbed);
    const ctx = apiCtx(seeded);

    const first = await handle.execute(ctx, {
      body: { user_id: 'cust_1', text: 'Hello' },
      idempotencyKey: 'request-1',
    });
    const second = await handle.execute(ctx, {
      body: { user_id: 'cust_1', text: 'Hello' },
      idempotencyKey: 'request-1',
    });

    expect(second.conversationId).toBe(first.conversationId);
    const messages = await testbed.tenants.run(seeded.workspaceId, () =>
      testbed.messages.listByConversation(
        seeded.workspaceId,
        internalConversationId(first.conversationId),
      ),
    );
    expect(messages).toHaveLength(1);
  });

  it('rejects an invalid body', async () => {
    const seeded = await seedApiChannel(testbed);

    await expect(
      handle.execute(apiCtx(seeded), {
        body: { user_id: '', text: 'Hello' },
        idempotencyKey: null,
      }),
    ).rejects.toBeInstanceOf(InvalidChannelInputError);
  });

  it('rejects a disconnected channel', async () => {
    const seeded = await seedApiChannel(testbed, { status: ChannelStatus.Disconnected });

    await expect(
      handle.execute(apiCtx(seeded), {
        body: { user_id: 'cust_1', text: 'Hello' },
        idempotencyKey: null,
      }),
    ).rejects.toBeInstanceOf(ChannelNotFoundError);
  });

  it('rejects a caller that is not an API channel', async () => {
    const seeded = await seedApiChannel(testbed);

    await expect(
      handle.execute(
        contexts.system({
          reason: SystemReason.Job,
          workspaceId: seeded.workspaceId,
          traceId: TRACE_ID,
          initiatedBy: null,
        }),
        {
          body: { user_id: 'cust_1', text: 'Hello' },
          idempotencyKey: null,
        },
      ),
    ).rejects.toBeInstanceOf(AuthenticationRequiredError);
  });
});
