import { ErrorReason } from '@agent-ic/contracts';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PauseMode } from '@/modules/agents';
import type { PauseSettings } from '@/modules/agents';
import {
  ConversationMode,
  ConversationState,
  WaitingReason,
} from '@/modules/conversations/constants/conversation.constants';
import { IncomingMessageOutcome } from '@/modules/conversations/constants/incoming-message.constants';
import { MessageAuthor } from '@/modules/conversations/constants/message.constants';
import type { IncomingMessageInput } from '@/modules/conversations/typedefs/incoming-message.typedefs';
import {
  AWAY_MESSAGE_TEXT,
  MESSAGE_SPACING_MS,
  MESSAGES_WHILE_AWAY,
  TEST_EXTERNAL_MESSAGE_ID,
} from '@test/support/constants/conversations-testing.constants';
import { incomingMessage, workspaceSystemCtx } from '@test/support/fixtures/conversation.fixture';
import {
  createConversationsTestbed,
  queuedEventsFor,
  seedAgent,
} from '@test/support/helpers/conversations-testing.helpers';
import {
  deliverOnOutboundQueued,
  notifyOnNeedsOperator,
  runOnMessageReceived,
} from '@test/support/jobs/conversation-probe.job';
import type { ConversationsTestbed } from '@test/support/typedefs/conversations-testing.typedefs';

describe('IncomingMessagesService', () => {
  let testbed: ConversationsTestbed;

  const receive = (input: IncomingMessageInput) => {
    testbed.clock.advanceBy(MESSAGE_SPACING_MS);
    return testbed.incoming.handleIncomingMessage(workspaceSystemCtx(input.workspaceId), input);
  };

  const pausedAs = (mode: PauseMode): PauseSettings => ({
    mode,
    awayMessage: mode === PauseMode.AwayMessage ? AWAY_MESSAGE_TEXT : null,
    pausedAt: testbed.clock.now(),
  });

  const historyOf = (workspaceId: string, conversationId: string, lastMessageId: string) =>
    testbed.tenants.run(workspaceId, () =>
      testbed.history.forRun(workspaceId, conversationId, lastMessageId),
    );

  const conversationOf = (workspaceId: string, conversationId: string) =>
    testbed.tenants.run(workspaceId, () =>
      testbed.conversations.findById(workspaceId, conversationId),
    );

  const startedBy = async (pause: PauseSettings | null = null) => {
    const workspaceId = testbed.ids.generate();
    const agentId = await seedAgent(testbed, workspaceId, pause);
    return incomingMessage(workspaceId, agentId);
  };

  beforeAll(async () => {
    testbed = await createConversationsTestbed();
  });

  afterAll(async () => {
    await testbed.module.close();
  });

  it('stores the message and asks for a run pinned to the given version', async () => {
    const input = await startedBy();
    const versionId = testbed.ids.generate();

    const result = await receive({ ...input, versionId });

    expect(result.outcome).toBe(IncomingMessageOutcome.RunRequested);
    expect(await queuedEventsFor(testbed, runOnMessageReceived, result.conversationId)).toEqual([
      {
        conversationId: result.conversationId,
        messageId: result.messageId,
        agentId: input.agentId,
        mode: ConversationMode.Live,
        versionId,
      },
    ]);
  });

  it('ignores a message whose external id was already received', async () => {
    const input = { ...(await startedBy()), externalId: TEST_EXTERNAL_MESSAGE_ID };

    const first = await receive(input);
    const second = await receive(input);

    expect(second).toEqual({
      outcome: IncomingMessageOutcome.Duplicate,
      conversationId: first.conversationId,
      messageId: null,
    });
    expect(await queuedEventsFor(testbed, runOnMessageReceived, first.conversationId)).toHaveLength(
      1,
    );
  });

  it('keeps one conversation when the same first message arrives twice at once', async () => {
    const input = { ...(await startedBy()), externalId: TEST_EXTERNAL_MESSAGE_ID };

    const [first, second] = await Promise.all([receive(input), receive(input)]);

    expect(second.conversationId).toBe(first.conversationId);
    expect([first.outcome, second.outcome]).toContain(IncomingMessageOutcome.Duplicate);
    const runs = await queuedEventsFor(testbed, runOnMessageReceived, first.conversationId);
    expect(runs).toHaveLength(1);
  });

  it('starts a new conversation after the last one was closed', async () => {
    const input = await startedBy();
    const first = await receive(input);
    await testbed.tenants.run(input.workspaceId, () =>
      testbed.runs.close(input.workspaceId, first.conversationId),
    );

    const second = await receive(input);
    const third = await receive(input);

    expect(second.conversationId).not.toBe(first.conversationId);
    expect(third.conversationId).toBe(second.conversationId);
  });

  it('routes the chat to the Inbox when the agent is paused to the Inbox', async () => {
    const input = await startedBy(pausedAs(PauseMode.Inbox));

    const first = await receive(input);
    const second = await receive(input);

    expect([first.outcome, second.outcome]).toEqual([
      IncomingMessageOutcome.RoutedToInbox,
      IncomingMessageOutcome.Stored,
    ]);
    expect((await conversationOf(input.workspaceId, first.conversationId))?.state).toBe(
      ConversationState.Waiting,
    );
    expect(await queuedEventsFor(testbed, notifyOnNeedsOperator, first.conversationId)).toEqual([
      {
        conversationId: first.conversationId,
        agentId: input.agentId,
        reason: WaitingReason.AgentPaused,
        mode: ConversationMode.Live,
      },
    ]);
    expect(await queuedEventsFor(testbed, runOnMessageReceived, first.conversationId)).toEqual([]);
  });

  it('sends the away message once for five customer messages', async () => {
    const input = await startedBy(pausedAs(PauseMode.AwayMessage));

    const first = await receive(input);
    let last = first;
    const later = [];
    for (let sent = 1; sent < MESSAGES_WHILE_AWAY; sent += 1) {
      last = await receive(input);
      later.push(last.outcome);
    }

    expect(first.outcome).toBe(IncomingMessageOutcome.AwayMessageQueued);
    expect(later).toEqual(
      Array.from({ length: MESSAGES_WHILE_AWAY - 1 }, () => IncomingMessageOutcome.Stored),
    );
    const { conversationId } = first;
    const history = await historyOf(input.workspaceId, conversationId, last.messageId ?? '');
    expect(history.filter((message) => message.author === MessageAuthor.Agent)).toEqual([
      expect.objectContaining({ text: AWAY_MESSAGE_TEXT }),
    ]);
    expect(history.filter((message) => message.author === MessageAuthor.Customer)).toHaveLength(
      MESSAGES_WHILE_AWAY,
    );
    expect(await queuedEventsFor(testbed, deliverOnOutboundQueued, conversationId)).toHaveLength(1);
    expect(await queuedEventsFor(testbed, runOnMessageReceived, conversationId)).toEqual([]);
  });

  it('sends the away message again after the agent is paused again', async () => {
    const input = await startedBy(pausedAs(PauseMode.AwayMessage));
    const first = await receive(input);
    testbed.clock.advanceBy(MESSAGE_SPACING_MS);
    await testbed.tenants.run(input.workspaceId, () =>
      testbed.agents.setPause(
        input.workspaceId,
        input.agentId,
        pausedAs(PauseMode.AwayMessage),
        testbed.clock.now(),
      ),
    );

    const second = await receive(input);

    expect(second.outcome).toBe(IncomingMessageOutcome.AwayMessageQueued);
    expect(
      await queuedEventsFor(testbed, deliverOnOutboundQueued, first.conversationId),
    ).toHaveLength(2);
  });

  it('only stores a message while the conversation is waiting', async () => {
    const input = await startedBy();
    const first = await receive(input);
    await testbed.tenants.run(input.workspaceId, () =>
      testbed.runs.markWaiting(workspaceSystemCtx(input.workspaceId), {
        workspaceId: input.workspaceId,
        conversationId: first.conversationId,
        reason: WaitingReason.Escalated,
      }),
    );

    const second = await receive(input);

    expect(second.outcome).toBe(IncomingMessageOutcome.Stored);
    expect(second.messageId).not.toBeNull();
    expect(await queuedEventsFor(testbed, runOnMessageReceived, first.conversationId)).toHaveLength(
      1,
    );
  });

  it('runs a simulation conversation even while the agent is paused', async () => {
    const input = await startedBy(pausedAs(PauseMode.Inbox));

    const result = await receive({ ...input, mode: ConversationMode.Simulation });

    expect(result.outcome).toBe(IncomingMessageOutcome.RunRequested);
  });

  it('refuses a message for an unknown agent', async () => {
    const input = incomingMessage(testbed.ids.generate(), testbed.ids.generate());

    await expect(receive(input)).rejects.toMatchObject({ reason: ErrorReason.AgentNotFound });
  });
});
