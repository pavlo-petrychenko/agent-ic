import { IdPrefix, WorkspaceRole } from '@agent-ic/contracts';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { ConversationState } from '@/modules/conversations/constants/conversation.constants';
import {
  MessageAuthor,
  MessageSystemEvent,
} from '@/modules/conversations/constants/message.constants';
import { ConversationClosedError } from '@/modules/conversations/errors/conversation-closed.error';
import { ConversationNotFoundError } from '@/modules/conversations/errors/conversation-not-found.error';
import { ConversationTakenError } from '@/modules/conversations/errors/conversation-taken.error';
import { TakeOverUseCase } from '@/modules/conversations/use-cases/take-over.use-case';
import { PermissionDeniedError } from '@/platform/context/errors/permission-denied.error';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { TEST_EDITOR_ID } from '@test/support/constants/agents-testing.constants';
import { workspaceCtx } from '@test/support/fixtures/workspace.fixture';
import {
  createConversationsTestbed,
  seedConversation,
} from '@test/support/helpers/conversations-testing.helpers';
import { ensureUserRow } from '@test/support/helpers/parent-rows.helpers';
import type { ConversationsTestbed } from '@test/support/typedefs/conversations-testing.typedefs';

describe('TakeOverUseCase', () => {
  let testbed: ConversationsTestbed;

  const takeOver = (ctx: UseCaseCtx, conversationId: string, fromOperator = false) =>
    testbed.module.get(TakeOverUseCase).execute(ctx, {
      conversationId: testbed.ids.toPublic(IdPrefix.Conversation, conversationId),
      fromOperator,
    });

  beforeAll(async () => {
    testbed = await createConversationsTestbed();
  });

  afterAll(async () => {
    await testbed.module.close();
  });

  it('takes over a live conversation for the operator', async () => {
    const live = await seedConversation(testbed);
    const ctx = workspaceCtx(TEST_EDITOR_ID, live.workspaceId, WorkspaceRole.Operator);

    const view = await takeOver(ctx, live.id);

    const stored = await testbed.tenants.run(live.workspaceId, () =>
      testbed.conversations.findById(live.workspaceId, live.id),
    );
    expect(view.state).toBe(ConversationState.Handled);
    expect(stored).toMatchObject({
      state: ConversationState.Handled,
      handledBy: TEST_EDITOR_ID,
    });
    const timeline = await testbed.tenants.run(live.workspaceId, () =>
      testbed.messages.listByConversation(live.workspaceId, live.id),
    );
    expect(timeline.at(-1)).toMatchObject({
      author: MessageAuthor.System,
      authorUserId: TEST_EDITOR_ID,
      systemEvent: MessageSystemEvent.TookOver,
    });
  });

  it('refuses a Builder, another workspace and a closed conversation', async () => {
    const live = await seedConversation(testbed);
    const ctx = workspaceCtx(TEST_EDITOR_ID, live.workspaceId, WorkspaceRole.Operator);

    await expect(
      takeOver(workspaceCtx(TEST_EDITOR_ID, live.workspaceId, WorkspaceRole.Builder), live.id),
    ).rejects.toBeInstanceOf(PermissionDeniedError);
    await expect(
      takeOver({ ...ctx, workspaceId: testbed.ids.generate() }, live.id),
    ).rejects.toBeInstanceOf(ConversationNotFoundError);
    await testbed.tenants.run(live.workspaceId, () =>
      testbed.conversations.close(live.workspaceId, live.id, testbed.clock.now(), null),
    );
    await expect(takeOver(ctx, live.id)).rejects.toBeInstanceOf(ConversationClosedError);
  });

  it('requires the explicit path to take over from another operator', async () => {
    const conversation = await seedConversation(testbed);
    const { workspaceId } = conversation;
    const firstUser = testbed.ids.generate();
    const secondUser = testbed.ids.generate();
    await ensureUserRow(testbed.module, firstUser);
    await ensureUserRow(testbed.module, secondUser);
    await testbed.tenants.run(workspaceId, () =>
      testbed.conversations.markWaiting(workspaceId, conversation.id),
    );
    const first = workspaceCtx(firstUser, workspaceId, WorkspaceRole.Operator);
    const second = workspaceCtx(secondUser, workspaceId, WorkspaceRole.Operator);

    await takeOver(first, conversation.id);
    await expect(takeOver(second, conversation.id)).rejects.toBeInstanceOf(ConversationTakenError);
    await takeOver(second, conversation.id, true);

    const stored = await testbed.tenants.run(workspaceId, () =>
      testbed.conversations.findById(workspaceId, conversation.id),
    );
    expect(stored).toMatchObject({
      state: ConversationState.Handled,
      handledBy: secondUser,
    });
  });
});
