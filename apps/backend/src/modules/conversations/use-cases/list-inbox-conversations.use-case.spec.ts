import { IdPrefix, WorkspaceRole } from '@agent-ic/contracts';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { InboxQueue } from '@/modules/conversations/constants/inbox.constants';
import { MessageAuthor } from '@/modules/conversations/constants/message.constants';
import { ListInboxConversationsUseCase } from '@/modules/conversations/use-cases/list-inbox-conversations.use-case';
import { PermissionDeniedError } from '@/platform/context/errors/permission-denied.error';
import { TEST_WORKSPACE_OWNER_NAME } from '@test/support/constants/workspace-testing.constants';
import { workspaceCtx } from '@test/support/fixtures/workspace.fixture';
import {
  createConversationsTestbed,
  seedConversation,
  seedMessage,
} from '@test/support/helpers/conversations-testing.helpers';
import { ensureUserRow } from '@test/support/helpers/parent-rows.helpers';
import type { ConversationsTestbed } from '@test/support/typedefs/conversations-testing.typedefs';

describe('ListInboxConversationsUseCase', () => {
  let testbed: ConversationsTestbed;

  const list = (
    ctx: ReturnType<typeof workspaceCtx>,
    limit: number | null = null,
    queue: InboxQueue = InboxQueue.NeedsYou,
  ) =>
    testbed.module.get(ListInboxConversationsUseCase).execute(ctx, {
      limit,
      queue,
      channelIds: [],
      agentIds: [],
      search: null,
    });

  beforeAll(async () => {
    testbed = await createConversationsTestbed();
  });

  afterAll(async () => {
    await testbed.module.close();
  });

  it('lists live conversations with previews, handlers and agent versions', async () => {
    const workspaceId = testbed.ids.generate();
    const userId = testbed.ids.generate();
    await ensureUserRow(testbed.module, userId);

    const handled = await seedConversation(testbed, workspaceId);
    await seedMessage(testbed, handled, { text: 'Handled message' });
    await testbed.tenants.run(workspaceId, () =>
      testbed.conversations.takeOver(workspaceId, handled.id, userId),
    );

    const waiting = await seedConversation(testbed, workspaceId);
    await seedMessage(testbed, waiting, {
      text: 'Waiting message',
      author: MessageAuthor.Customer,
    });
    await testbed.tenants.run(workspaceId, () =>
      testbed.conversations.markWaiting(workspaceId, waiting.id),
    );

    const summaries = await list(workspaceCtx(userId, workspaceId, WorkspaceRole.Owner));

    const publicId = (id: string) => testbed.ids.toPublic(IdPrefix.Conversation, id);
    expect(summaries.map((summary) => summary.id)).toEqual(
      expect.arrayContaining([publicId(handled.id), publicId(waiting.id)]),
    );
    const handledSummary = summaries.find((summary) => summary.id === publicId(handled.id));
    expect(handledSummary).toMatchObject({
      handledByMe: true,
      handledByName: TEST_WORKSPACE_OWNER_NAME,
      hasBeenHandled: true,
      preview: 'Handled message',
    });
    expect(handledSummary?.agentName).not.toBe('');
    const waitingSummary = summaries.find((summary) => summary.id === publicId(waiting.id));
    expect(waitingSummary).toMatchObject({
      handledByMe: false,
      hasBeenHandled: false,
      preview: 'Waiting message',
    });
  });

  it('applies the limit', async () => {
    const workspaceId = testbed.ids.generate();
    const userId = testbed.ids.generate();
    await ensureUserRow(testbed.module, userId);
    const first = await seedConversation(testbed, workspaceId);
    const second = await seedConversation(testbed, workspaceId);

    const summaries = await list(
      workspaceCtx(userId, workspaceId, WorkspaceRole.Owner),
      1,
      InboxQueue.Live,
    );

    expect(summaries).toHaveLength(1);
    expect([
      testbed.ids.toPublic(IdPrefix.Conversation, first.id),
      testbed.ids.toPublic(IdPrefix.Conversation, second.id),
    ]).toContain(summaries[0]?.id);
  });

  it('denies a role without Inbox view', async () => {
    const workspaceId = testbed.ids.generate();
    const userId = testbed.ids.generate();
    await ensureUserRow(testbed.module, userId);

    await expect(
      list(workspaceCtx(userId, workspaceId, WorkspaceRole.Builder)),
    ).rejects.toBeInstanceOf(PermissionDeniedError);
  });
});
