import { IdPrefix, WorkspaceRole } from '@agent-ic/contracts';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  CloseReason,
  ConversationState,
} from '@/modules/conversations/constants/conversation.constants';
import { ConversationClosedError } from '@/modules/conversations/errors/conversation-closed.error';
import { ConversationNotFoundError } from '@/modules/conversations/errors/conversation-not-found.error';
import { CloseConversationUseCase } from '@/modules/conversations/use-cases/close-conversation.use-case';
import { PermissionDeniedError } from '@/platform/context/errors/permission-denied.error';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { TEST_EDITOR_ID } from '@test/support/constants/agents-testing.constants';
import { AGENT_REPLY_TEXT } from '@test/support/constants/conversations-testing.constants';
import { workspaceCtx } from '@test/support/fixtures/workspace.fixture';
import {
  createConversationsTestbed,
  queuedEventsFor,
  seedConversation,
} from '@test/support/helpers/conversations-testing.helpers';
import { deliverOnOutboundQueued } from '@test/support/jobs/conversation-probe.job';
import type { ConversationsTestbed } from '@test/support/typedefs/conversations-testing.typedefs';

describe('CloseConversationUseCase', () => {
  let testbed: ConversationsTestbed;

  const close = (ctx: UseCaseCtx, conversationId: string, message: string | null = null) =>
    testbed.module.get(CloseConversationUseCase).execute(ctx, {
      conversationId: testbed.ids.toPublic(IdPrefix.Conversation, conversationId),
      message,
    });

  beforeAll(async () => {
    testbed = await createConversationsTestbed();
  });

  afterAll(async () => {
    await testbed.module.close();
  });

  it('closes a live chat and sends the closing message', async () => {
    const live = await seedConversation(testbed);
    const ctx = workspaceCtx(TEST_EDITOR_ID, live.workspaceId, WorkspaceRole.Operator);

    const view = await close(ctx, live.id, AGENT_REPLY_TEXT);

    const stored = await testbed.tenants.run(live.workspaceId, () =>
      testbed.conversations.findById(live.workspaceId, live.id),
    );
    expect(view.state).toBe(ConversationState.Closed);
    expect(view.closeReason).toBe(CloseReason.ClosedByOperator);
    expect(stored).toMatchObject({
      state: ConversationState.Closed,
      closeReason: CloseReason.ClosedByOperator,
    });
    expect(await queuedEventsFor(testbed, deliverOnOutboundQueued, live.id)).toHaveLength(1);
  });

  it('closes a chat without a message', async () => {
    const live = await seedConversation(testbed);
    const ctx = workspaceCtx(TEST_EDITOR_ID, live.workspaceId, WorkspaceRole.Operator);

    const view = await close(ctx, live.id);

    expect(view.state).toBe(ConversationState.Closed);
    expect(await queuedEventsFor(testbed, deliverOnOutboundQueued, live.id)).toEqual([]);
  });

  it('refuses a Builder, another workspace and a closed conversation', async () => {
    const live = await seedConversation(testbed);
    const ctx = workspaceCtx(TEST_EDITOR_ID, live.workspaceId, WorkspaceRole.Operator);

    await expect(
      close(workspaceCtx(TEST_EDITOR_ID, live.workspaceId, WorkspaceRole.Builder), live.id),
    ).rejects.toBeInstanceOf(PermissionDeniedError);
    await expect(
      close({ ...ctx, workspaceId: testbed.ids.generate() }, live.id),
    ).rejects.toBeInstanceOf(ConversationNotFoundError);
    await close(ctx, live.id);
    await expect(close(ctx, live.id)).rejects.toBeInstanceOf(ConversationClosedError);
  });
});
