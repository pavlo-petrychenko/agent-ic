import { IdPrefix, WorkspaceRole } from '@agent-ic/contracts';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { MessageAuthor } from '@/modules/conversations/constants/message.constants';
import { ConversationNotFoundError } from '@/modules/conversations/errors/conversation-not-found.error';
import { GetInboxConversationUseCase } from '@/modules/conversations/use-cases/get-inbox-conversation.use-case';
import { PermissionDeniedError } from '@/platform/context/errors/permission-denied.error';
import { workspaceCtx } from '@test/support/fixtures/workspace.fixture';
import {
  createConversationsTestbed,
  seedConversation,
  seedMessage,
} from '@test/support/helpers/conversations-testing.helpers';
import { ensureUserRow } from '@test/support/helpers/parent-rows.helpers';
import type { ConversationsTestbed } from '@test/support/typedefs/conversations-testing.typedefs';

describe('GetInboxConversationUseCase', () => {
  let testbed: ConversationsTestbed;

  const get = (ctx: ReturnType<typeof workspaceCtx>, id: string) =>
    testbed.module.get(GetInboxConversationUseCase).execute(ctx, { id });

  beforeAll(async () => {
    testbed = await createConversationsTestbed();
  });

  afterAll(async () => {
    await testbed.module.close();
  });

  it('returns the conversation and its messages', async () => {
    const workspaceId = testbed.ids.generate();
    const userId = testbed.ids.generate();
    await ensureUserRow(testbed.module, userId);
    const conversation = await seedConversation(testbed, workspaceId);
    await seedMessage(testbed, conversation, {
      text: 'Customer question',
      author: MessageAuthor.Customer,
    });
    await seedMessage(testbed, conversation, {
      text: 'Operator answer',
      author: MessageAuthor.Operator,
    });
    const publicId = testbed.ids.toPublic(IdPrefix.Conversation, conversation.id);

    const detail = await get(workspaceCtx(userId, workspaceId, WorkspaceRole.Operator), publicId);

    expect(detail.summary.id).toBe(publicId);
    expect(detail.messages.map((message) => message.text)).toEqual([
      'Customer question',
      'Operator answer',
    ]);
  });

  it('refuses an unknown conversation', async () => {
    const workspaceId = testbed.ids.generate();
    const userId = testbed.ids.generate();
    await ensureUserRow(testbed.module, userId);
    const unknown = testbed.ids.toPublic(IdPrefix.Conversation, testbed.ids.generate());

    await expect(
      get(workspaceCtx(userId, workspaceId, WorkspaceRole.Owner), unknown),
    ).rejects.toBeInstanceOf(ConversationNotFoundError);
  });

  it('denies a role without Inbox view', async () => {
    const workspaceId = testbed.ids.generate();
    const userId = testbed.ids.generate();
    await ensureUserRow(testbed.module, userId);
    const conversation = await seedConversation(testbed, workspaceId);
    const publicId = testbed.ids.toPublic(IdPrefix.Conversation, conversation.id);

    await expect(
      get(workspaceCtx(userId, workspaceId, WorkspaceRole.Builder), publicId),
    ).rejects.toBeInstanceOf(PermissionDeniedError);
  });
});
