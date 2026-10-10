import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { MessageAuthor } from '@/modules/conversations/constants/message.constants';
import { MessageNotFoundError } from '@/modules/conversations/errors/message-not-found.error';
import type { Message } from '@/modules/conversations/typedefs/message.typedefs';
import { LONG_HISTORY_SIZE } from '@test/support/constants/conversations-testing.constants';
import {
  createConversationsTestbed,
  seedConversation,
  seedMessage,
} from '@test/support/helpers/conversations-testing.helpers';
import type { ConversationsTestbed } from '@test/support/typedefs/conversations-testing.typedefs';

describe('ConversationHistoryService', () => {
  let testbed: ConversationsTestbed;

  const historyIds = async (
    workspaceId: string,
    conversationId: string,
    upTo: Message,
  ): Promise<string[]> => {
    const history = await testbed.tenants.run(workspaceId, () =>
      testbed.history.forRun(workspaceId, conversationId, upTo.id),
    );
    return history.map((message) => message.id);
  };

  beforeAll(async () => {
    testbed = await createConversationsTestbed();
  });

  afterAll(async () => {
    await testbed.module.close();
  });

  it('returns every message of a long conversation, oldest first', async () => {
    const conversation = await seedConversation(testbed);
    const seeded: Message[] = [];
    for (let turn = 0; turn < LONG_HISTORY_SIZE; turn += 1) {
      seeded.push(await seedMessage(testbed, conversation));
      seeded.push(await seedMessage(testbed, conversation, { author: MessageAuthor.Agent }));
    }
    const last = await seedMessage(testbed, conversation);

    const history = await historyIds(conversation.workspaceId, conversation.id, last);

    expect(history).toEqual([...seeded, last].map((message) => message.id));
  });

  it('stops at the given message and leaves out other conversations', async () => {
    const conversation = await seedConversation(testbed);
    const neighbour = await seedConversation(testbed, conversation.workspaceId);
    const first = await seedMessage(testbed, conversation);
    await seedMessage(testbed, neighbour);
    const second = await seedMessage(testbed, conversation);
    await seedMessage(testbed, conversation);

    const history = await historyIds(conversation.workspaceId, conversation.id, second);

    expect(history).toEqual([first.id, second.id]);
  });

  it('refuses a message from another conversation', async () => {
    const conversation = await seedConversation(testbed);
    const neighbour = await seedConversation(testbed, conversation.workspaceId);
    const foreign = await seedMessage(testbed, neighbour);

    await expect(
      historyIds(conversation.workspaceId, conversation.id, foreign),
    ).rejects.toBeInstanceOf(MessageNotFoundError);
  });
});
