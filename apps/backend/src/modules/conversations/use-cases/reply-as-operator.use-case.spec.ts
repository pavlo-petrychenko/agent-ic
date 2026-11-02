import { IdPrefix, WorkspaceRole } from '@agent-ic/contracts';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { ConversationState } from '@/modules/conversations/constants/conversation.constants';
import { InboxActivityKind } from '@/modules/conversations/constants/inbox-activity.constants';
import { MessageAuthor } from '@/modules/conversations/constants/message.constants';
import { ConversationNotFoundError } from '@/modules/conversations/errors/conversation-not-found.error';
import { ReplyAsOperatorUseCase } from '@/modules/conversations/use-cases/reply-as-operator.use-case';
import { PermissionDeniedError } from '@/platform/context/errors/permission-denied.error';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { TEST_EDITOR_ID } from '@test/support/constants/agents-testing.constants';
import { AGENT_REPLY_TEXT } from '@test/support/constants/conversations-testing.constants';
import { workspaceCtx } from '@test/support/fixtures/workspace.fixture';
import {
  createConversationsTestbed,
  inboxActivity,
  queuedEventsFor,
  seedConversation,
} from '@test/support/helpers/conversations-testing.helpers';
import { startTestSimulation } from '@test/support/helpers/simulator-testing.helpers';
import { deliverOnOutboundQueued } from '@test/support/jobs/conversation-probe.job';
import type { ConversationsTestbed } from '@test/support/typedefs/conversations-testing.typedefs';

describe('ReplyAsOperatorUseCase', () => {
  let testbed: ConversationsTestbed;

  const reply = (ctx: UseCaseCtx, conversationId: string) =>
    testbed.module.get(ReplyAsOperatorUseCase).execute(ctx, {
      conversationId: testbed.ids.toPublic(IdPrefix.Conversation, conversationId),
      text: AGENT_REPLY_TEXT,
    });

  beforeAll(async () => {
    testbed = await createConversationsTestbed();
  });

  afterAll(async () => {
    await testbed.module.close();
  });

  it('takes over the simulation and sends the reply', async () => {
    const { workspaceId, ctx, conversationId } = await startTestSimulation(testbed);

    const message = await reply(ctx, conversationId);

    const conversation = await testbed.tenants.run(workspaceId, () =>
      testbed.conversations.findById(workspaceId, conversationId),
    );
    const queued = await queuedEventsFor(testbed, deliverOnOutboundQueued, conversationId);
    expect(message).toMatchObject({
      author: MessageAuthor.Operator,
      authorId: testbed.ids.toPublic(IdPrefix.User, TEST_EDITOR_ID),
      runId: null,
    });
    expect(conversation?.state).toBe(ConversationState.Handled);
    expect(queued).toHaveLength(1);
  });

  it('lets the Inbox answer a live chat, and keeps Builders out of it', async () => {
    const live = await seedConversation(testbed);
    const as = (role: WorkspaceRole) => workspaceCtx(TEST_EDITOR_ID, live.workspaceId, role);
    const activity = await inboxActivity(testbed, live.workspaceId);

    const message = await reply(as(WorkspaceRole.Operator), live.id);

    const received = await activity.next();
    await activity.return();
    expect(message.author).toBe(MessageAuthor.Operator);
    expect(received.value).toEqual({
      conversationId: live.id,
      kind: InboxActivityKind.ConversationUpdated,
    });
    await expect(reply(as(WorkspaceRole.Builder), live.id)).rejects.toBeInstanceOf(
      PermissionDeniedError,
    );
  });

  it("keeps an Operator out of a simulation, and a Builder out of another's", async () => {
    const { workspaceId, conversationId, ctx } = await startTestSimulation(testbed);
    const as = (role: WorkspaceRole) => workspaceCtx(testbed.ids.generate(), workspaceId, role);
    const elsewhere = { ...ctx, workspaceId: testbed.ids.generate() };

    await expect(reply(as(WorkspaceRole.Operator), conversationId)).rejects.toBeInstanceOf(
      PermissionDeniedError,
    );
    await expect(reply(as(WorkspaceRole.Builder), conversationId)).rejects.toBeInstanceOf(
      ConversationNotFoundError,
    );
    await expect(reply(elsewhere, conversationId)).rejects.toBeInstanceOf(
      ConversationNotFoundError,
    );
  });
});
