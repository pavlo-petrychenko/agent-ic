import { IdPrefix, WorkspaceRole } from '@agent-ic/contracts';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { ConversationState } from '@/modules/conversations/constants/conversation.constants';
import { MessageAuthor } from '@/modules/conversations/constants/message.constants';
import { ConversationNotFoundError } from '@/modules/conversations/errors/conversation-not-found.error';
import { ReplyAsOperatorUseCase } from '@/modules/conversations/use-cases/reply-as-operator.use-case';
import { PermissionDeniedError } from '@/platform/context/errors/permission-denied.error';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { AGENT_REPLY_TEXT } from '@test/support/constants/conversations-testing.constants';
import { workspaceCtx } from '@test/support/fixtures/workspace.fixture';
import {
  createConversationsTestbed,
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
    expect(message).toMatchObject({ author: MessageAuthor.Operator, runId: null });
    expect(conversation?.state).toBe(ConversationState.Handled);
    expect(queued).toHaveLength(1);
  });

  it('lets the Inbox answer a live chat, and keeps Builders out of it', async () => {
    const live = await seedConversation(testbed);
    const as = (role: WorkspaceRole) =>
      workspaceCtx(testbed.ids.generate(), live.workspaceId, role);

    const message = await reply(as(WorkspaceRole.Operator), live.id);

    expect(message.author).toBe(MessageAuthor.Operator);
    await expect(reply(as(WorkspaceRole.Builder), live.id)).rejects.toBeInstanceOf(
      PermissionDeniedError,
    );
  });

  it("keeps an Operator out of a simulation, and a Builder out of another's", async () => {
    const { workspaceId, conversationId } = await startTestSimulation(testbed);
    const as = (role: WorkspaceRole) => workspaceCtx(testbed.ids.generate(), workspaceId, role);

    await expect(reply(as(WorkspaceRole.Operator), conversationId)).rejects.toBeInstanceOf(
      PermissionDeniedError,
    );
    await expect(reply(as(WorkspaceRole.Builder), conversationId)).rejects.toBeInstanceOf(
      ConversationNotFoundError,
    );
  });
});
