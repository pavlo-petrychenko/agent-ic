import { IdPrefix, WorkspaceRole } from '@agent-ic/contracts';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { ConversationActivityKind } from '@/modules/conversations/constants/conversation-activity.constants';
import { ConversationMode } from '@/modules/conversations/constants/conversation.constants';
import { ConversationNotFoundError } from '@/modules/conversations/errors/conversation-not-found.error';
import { ConversationActivityService } from '@/modules/conversations/services/conversation-activity.service';
import type { NewConversation } from '@/modules/conversations/typedefs/conversation.typedefs';
import { SubscribeToConversationActivityUseCase } from '@/modules/conversations/use-cases/subscribe-to-conversation-activity.use-case';
import { PermissionDeniedError } from '@/platform/context/errors/permission-denied.error';
import { newConversation } from '@test/support/fixtures/conversation.fixture';
import { workspaceCtx } from '@test/support/fixtures/workspace.fixture';
import { createConversationsTestbed } from '@test/support/helpers/conversations-testing.helpers';
import type { ConversationsTestbed } from '@test/support/typedefs/conversations-testing.typedefs';

describe('SubscribeToConversationActivityUseCase', () => {
  let testbed: ConversationsTestbed;

  const seed = async (mode = ConversationMode.Simulation): Promise<NewConversation> => {
    const conversation = { ...newConversation(testbed, testbed.ids.generate()), mode };
    await testbed.tenants.run(conversation.workspaceId, () =>
      testbed.conversations.insert(conversation),
    );
    return conversation;
  };

  const subscribe = (
    conversation: NewConversation,
    workspaceId = conversation.workspaceId,
    role = WorkspaceRole.Builder,
  ) =>
    testbed.module
      .get(SubscribeToConversationActivityUseCase)
      .execute(workspaceCtx(testbed.ids.generate(), workspaceId, role), {
        conversationId: testbed.ids.toPublic(IdPrefix.Conversation, conversation.id),
      });

  beforeAll(async () => {
    testbed = await createConversationsTestbed();
  });

  afterAll(async () => {
    await testbed.module.close();
  });

  it('streams what changed in a simulation, with public ids only', async () => {
    const conversation = await seed();
    const runId = testbed.ids.generate();
    const activity = await subscribe(conversation);

    await testbed.tenants.run(conversation.workspaceId, () =>
      testbed.module.get(ConversationActivityService).runStarted(conversation.id, runId),
    );

    const received = await activity.next();
    await activity.return();
    expect(received.value).toEqual({
      conversationId: testbed.ids.toPublic(IdPrefix.Conversation, conversation.id),
      kind: ConversationActivityKind.RunStarted,
      messageId: null,
      runId: testbed.ids.toPublic(IdPrefix.Run, runId),
    });
  });

  it('does not let another workspace subscribe', async () => {
    const conversation = await seed();

    const attempt = subscribe(conversation, testbed.ids.generate());

    await expect(attempt).rejects.toBeInstanceOf(ConversationNotFoundError);
  });

  it('does not stream a live conversation, which belongs to the Inbox', async () => {
    const conversation = await seed(ConversationMode.Live);

    await expect(subscribe(conversation)).rejects.toBeInstanceOf(ConversationNotFoundError);
  });

  it('refuses an operator', async () => {
    const conversation = await seed();

    const attempt = subscribe(conversation, conversation.workspaceId, WorkspaceRole.Operator);

    await expect(attempt).rejects.toBeInstanceOf(PermissionDeniedError);
  });
});
