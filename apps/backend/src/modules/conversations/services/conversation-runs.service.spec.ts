import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { ConversationActivityKind } from '@/modules/conversations/constants/conversation-activity.constants';
import {
  CloseReason,
  ConversationMode,
  ConversationState,
  WaitingReason,
} from '@/modules/conversations/constants/conversation.constants';
import {
  MessageAuthor,
  MessageDelivery,
} from '@/modules/conversations/constants/message.constants';
import { ConversationClosedError } from '@/modules/conversations/errors/conversation-closed.error';
import { MessageNotFoundError } from '@/modules/conversations/errors/message-not-found.error';
import type { NewConversation } from '@/modules/conversations/typedefs/conversation.typedefs';
import type {
  OutboundMessageInput,
  QuickReplyTextInput,
} from '@/modules/conversations/typedefs/message.typedefs';
import {
  AGENT_REPLY_TEXT,
  QUICK_REPLIES,
  TEST_IDEMPOTENCY_KEY,
} from '@test/support/constants/conversations-testing.constants';
import { newConversation, workspaceSystemCtx } from '@test/support/fixtures/conversation.fixture';
import {
  conversationActivity,
  createConversationsTestbed,
  queuedEventsFor,
  seedConversation,
  seedMessage,
  seedTiedMessages,
} from '@test/support/helpers/conversations-testing.helpers';
import { ensureAgentRow, seedRunRow } from '@test/support/helpers/parent-rows.helpers';
import {
  deliverOnOutboundQueued,
  notifyOnNeedsOperator,
} from '@test/support/jobs/conversation-probe.job';
import type { ConversationsTestbed } from '@test/support/typedefs/conversations-testing.typedefs';

describe('ConversationRunsService', () => {
  let testbed: ConversationsTestbed;

  const inTenant = <TResult>(
    conversation: NewConversation,
    work: () => Promise<TResult>,
  ): Promise<TResult> => testbed.tenants.run(conversation.workspaceId, work);

  const outbound = async (conversation: NewConversation): Promise<OutboundMessageInput> => ({
    workspaceId: conversation.workspaceId,
    conversationId: conversation.id,
    key: `${TEST_IDEMPOTENCY_KEY}:${conversation.id}`,
    author: MessageAuthor.Agent,
    text: AGENT_REPLY_TEXT,
    quickReplies: QUICK_REPLIES,
    runId: await seedRunRow(testbed.module, conversation),
  });

  const recordOutbound = async (
    conversation: NewConversation,
    input: OutboundMessageInput | null = null,
  ) => {
    const message = input ?? (await outbound(conversation));
    return inTenant(conversation, () =>
      testbed.runs.recordOutbound(workspaceSystemCtx(conversation.workspaceId), message),
    );
  };

  const markWaiting = (conversation: NewConversation) =>
    inTenant(conversation, () =>
      testbed.runs.markWaiting(workspaceSystemCtx(conversation.workspaceId), {
        workspaceId: conversation.workspaceId,
        conversationId: conversation.id,
        reason: WaitingReason.Escalated,
      }),
    );

  const stateOf = async (conversation: NewConversation) =>
    inTenant(conversation, () =>
      testbed.conversations.findById(conversation.workspaceId, conversation.id),
    );

  const seedQuickReplyConversation = async () => {
    const workspaceId = testbed.ids.generate();
    const channelId = testbed.ids.generate();
    const conversation = { ...newConversation(testbed, workspaceId), channelId };
    await ensureAgentRow(testbed.module, workspaceId, conversation.agentId);
    await inTenant(conversation, () => testbed.conversations.insert(conversation));
    return { conversation, channelId };
  };

  const resolveQuickReply = (
    conversation: NewConversation,
    channelId: string,
    messageId: string,
    overrides: Partial<QuickReplyTextInput> = {},
  ): Promise<string | null> =>
    inTenant(conversation, () =>
      testbed.runs.quickReplyText({
        workspaceId: conversation.workspaceId,
        messageId,
        index: 0,
        channelId,
        endUserExternalId: conversation.endUserExternalId,
        ...overrides,
      }),
    );

  beforeAll(async () => {
    testbed = await createConversationsTestbed();
  });

  afterAll(async () => {
    await testbed.module.close();
  });

  it('stores why the conversation closed and announces the close once', async () => {
    const conversation = await seedConversation(testbed);
    const activity = await conversationActivity(testbed, conversation.id);
    const close = () =>
      inTenant(conversation, () =>
        testbed.runs.close(conversation.workspaceId, conversation.id, CloseReason.EndedByAgent),
      );

    await close();
    await close();

    const announced = await activity.next();
    await activity.return();
    expect(announced.value).toEqual({
      conversationId: conversation.id,
      kind: ConversationActivityKind.ConversationClosed,
      messageId: null,
      runId: null,
    });
    expect(await stateOf(conversation)).toMatchObject({
      state: ConversationState.Closed,
      closeReason: CloseReason.EndedByAgent,
    });
  });

  it('closes without a reason when none is given', async () => {
    const conversation = await seedConversation(testbed);

    await inTenant(conversation, () =>
      testbed.runs.close(conversation.workspaceId, conversation.id),
    );

    expect(await stateOf(conversation)).toMatchObject({ closeReason: null });
  });

  it('records one message and one event when the same key is recorded twice', async () => {
    const conversation = await seedConversation(testbed);
    const input = await outbound(conversation);

    const first = await recordOutbound(conversation, input);
    const second = await recordOutbound(conversation, input);

    const events = await queuedEventsFor(testbed, deliverOnOutboundQueued, conversation.id);
    expect(second.id).toBe(first.id);
    expect(first).toMatchObject({
      delivery: MessageDelivery.Pending,
      quickReplies: QUICK_REPLIES,
      idempotencyKey: input.key,
    });
    expect(events).toEqual([
      {
        conversationId: conversation.id,
        messageId: first.id,
        channelKind: conversation.channelKind,
        mode: ConversationMode.Live,
      },
    ]);
  });

  it('announces the recorded message with its run to the conversation activity', async () => {
    const conversation = await seedConversation(testbed);
    const activity = await conversationActivity(testbed, conversation.id);
    const input = await outbound(conversation);

    const recorded = await recordOutbound(conversation, input);

    const announced = await activity.next();
    await activity.return();
    expect(announced.value).toEqual({
      conversationId: conversation.id,
      kind: ConversationActivityKind.MessageAdded,
      messageId: recorded.id,
      runId: input.runId,
    });
  });

  it('refuses to record a new outbound message in a closed conversation', async () => {
    const conversation = await seedConversation(testbed);
    await inTenant(conversation, () =>
      testbed.runs.close(conversation.workspaceId, conversation.id),
    );

    await expect(recordOutbound(conversation)).rejects.toBeInstanceOf(ConversationClosedError);
    expect(await stateOf(conversation)).toMatchObject({
      state: ConversationState.Closed,
      closedAt: testbed.clock.now(),
    });
  });

  it('lists only the customer messages after the given one', async () => {
    const conversation = await seedConversation(testbed);
    const covered = await seedMessage(testbed, conversation);
    await seedMessage(testbed, conversation, { author: MessageAuthor.Agent });
    const newer = await seedMessage(testbed, conversation);

    const after = await inTenant(conversation, () =>
      testbed.runs.messagesAfter(conversation.workspaceId, conversation.id, covered.id),
    );

    expect(after.map((message) => message.id)).toEqual([newer.id]);
  });

  it('lists only the later of the messages that share a creation time', async () => {
    const conversation = await seedConversation(testbed);
    const { middle, later } = await seedTiedMessages(testbed, conversation);

    const after = await inTenant(conversation, () =>
      testbed.runs.messagesAfter(conversation.workspaceId, conversation.id, middle.id),
    );

    expect(after.map((message) => message.id)).toEqual([later.id]);
  });

  it('marks the conversation waiting and asks for an operator once', async () => {
    const conversation = await seedConversation(testbed);

    await markWaiting(conversation);
    await markWaiting(conversation);

    const events = await queuedEventsFor(testbed, notifyOnNeedsOperator, conversation.id);
    expect((await stateOf(conversation))?.state).toBe(ConversationState.Waiting);
    expect(events).toEqual([
      {
        conversationId: conversation.id,
        agentId: conversation.agentId,
        reason: WaitingReason.Escalated,
        mode: ConversationMode.Live,
      },
    ]);
  });

  it('stamps when the conversation was escalated', async () => {
    const conversation = await seedConversation(testbed);
    expect((await stateOf(conversation))?.lastEscalatedAt).toBeNull();

    await markWaiting(conversation);

    expect((await stateOf(conversation))?.lastEscalatedAt).toEqual(testbed.clock.now());
  });

  it('marks a simulation waiting without asking anyone', async () => {
    const workspaceId = testbed.ids.generate();
    const conversation = {
      ...newConversation(testbed, workspaceId),
      mode: ConversationMode.Simulation,
    };
    await ensureAgentRow(testbed.module, workspaceId, conversation.agentId);
    await inTenant(conversation, () => testbed.conversations.insert(conversation));

    expect(await markWaiting(conversation)).toBe(true);

    const events = await queuedEventsFor(testbed, notifyOnNeedsOperator, conversation.id);
    expect((await stateOf(conversation))?.state).toBe(ConversationState.Waiting);
    expect(events).toEqual([]);
  });

  it('marks the delivery of a message, and refuses an unknown one', async () => {
    const conversation = await seedConversation(testbed);
    const message = await recordOutbound(conversation);
    const markDelivery = (messageId: string) =>
      inTenant(conversation, () =>
        testbed.runs.markDelivery(conversation.workspaceId, messageId, MessageDelivery.Delivered),
      );

    await markDelivery(message.id);

    const stored = await inTenant(conversation, () =>
      testbed.messages.findById(conversation.workspaceId, message.id),
    );
    expect(stored?.delivery).toBe(MessageDelivery.Delivered);
    await expect(markDelivery(testbed.ids.generate())).rejects.toBeInstanceOf(MessageNotFoundError);
  });

  it('resolves the stored quick reply for its message and chat', async () => {
    const { conversation, channelId } = await seedQuickReplyConversation();
    const message = await recordOutbound(conversation);

    expect(await resolveQuickReply(conversation, channelId, message.id)).toBe(QUICK_REPLIES[0]);
    expect(await resolveQuickReply(conversation, channelId, message.id, { index: 1 })).toBe(
      QUICK_REPLIES[1],
    );
  });

  it('refuses a quick reply from an unknown message or an index outside it', async () => {
    const { conversation, channelId } = await seedQuickReplyConversation();
    const message = await recordOutbound(conversation);

    expect(await resolveQuickReply(conversation, channelId, testbed.ids.generate())).toBeNull();
    expect(
      await resolveQuickReply(conversation, channelId, message.id, {
        index: QUICK_REPLIES.length,
      }),
    ).toBeNull();
  });

  it('refuses a quick reply from another channel or chat', async () => {
    const { conversation, channelId } = await seedQuickReplyConversation();
    const message = await recordOutbound(conversation);

    expect(await resolveQuickReply(conversation, testbed.ids.generate(), message.id)).toBeNull();
    expect(
      await resolveQuickReply(conversation, channelId, message.id, {
        endUserExternalId: `${conversation.endUserExternalId}-other`,
      }),
    ).toBeNull();
  });

  it('refuses a blank quick reply but keeps the next index', async () => {
    const { conversation, channelId } = await seedQuickReplyConversation();
    const input = { ...(await outbound(conversation)), quickReplies: ['  ', 'Call'] };
    const message = await recordOutbound(conversation, input);

    expect(await resolveQuickReply(conversation, channelId, message.id)).toBeNull();
    expect(await resolveQuickReply(conversation, channelId, message.id, { index: 1 })).toBe('Call');
  });
});
