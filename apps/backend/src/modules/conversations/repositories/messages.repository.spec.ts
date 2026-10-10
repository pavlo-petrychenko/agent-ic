import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { NewMessage } from '@/modules/conversations/typedefs/message.typedefs';
import {
  OTHER_MESSAGE_TEXT,
  TEST_EXTERNAL_MESSAGE_ID,
  TEST_IDEMPOTENCY_KEY,
} from '@test/support/constants/conversations-testing.constants';
import { newMessage } from '@test/support/fixtures/conversation.fixture';
import {
  createConversationsTestbed,
  seedConversation,
} from '@test/support/helpers/conversations-testing.helpers';
import type { ConversationsTestbed } from '@test/support/typedefs/conversations-testing.typedefs';

describe('MessagesRepository', () => {
  let testbed: ConversationsTestbed;

  const insertBoth = async (
    workspaceId: string,
    first: NewMessage,
    second: NewMessage,
  ): Promise<readonly [boolean, boolean]> =>
    testbed.tenants.run(workspaceId, async () => [
      (await testbed.messages.insertIfAbsent(first)) !== null,
      (await testbed.messages.insertIfAbsent(second)) !== null,
    ]);

  beforeAll(async () => {
    testbed = await createConversationsTestbed();
  });

  afterAll(async () => {
    await testbed.module.close();
  });

  it('ignores a second message with the same external id in a conversation', async () => {
    const conversation = await seedConversation(testbed);
    const overrides = { externalId: TEST_EXTERNAL_MESSAGE_ID };
    const first = newMessage(testbed, conversation, overrides);
    const duplicate = newMessage(testbed, conversation, { ...overrides, text: OTHER_MESSAGE_TEXT });

    const inserted = await insertBoth(conversation.workspaceId, first, duplicate);

    const stored = await testbed.tenants.run(conversation.workspaceId, () =>
      testbed.messages.findByExternalId(
        conversation.workspaceId,
        conversation.id,
        TEST_EXTERNAL_MESSAGE_ID,
      ),
    );
    expect(inserted).toEqual([true, false]);
    expect(stored?.id).toBe(first.id);
  });

  it('ignores a second message with the same idempotency key', async () => {
    const conversation = await seedConversation(testbed);
    const overrides = { idempotencyKey: TEST_IDEMPOTENCY_KEY };
    const first = newMessage(testbed, conversation, overrides);
    const duplicate = newMessage(testbed, conversation, { ...overrides, text: OTHER_MESSAGE_TEXT });

    const inserted = await insertBoth(conversation.workspaceId, first, duplicate);

    const stored = await testbed.tenants.run(conversation.workspaceId, () =>
      testbed.messages.findByIdempotencyKey(conversation.workspaceId, TEST_IDEMPOTENCY_KEY),
    );
    expect(inserted).toEqual([true, false]);
    expect(stored?.id).toBe(first.id);
  });

  it('stores messages that have neither an external id nor a key', async () => {
    const conversation = await seedConversation(testbed);

    const inserted = await insertBoth(
      conversation.workspaceId,
      newMessage(testbed, conversation),
      newMessage(testbed, conversation),
    );

    expect(inserted).toEqual([true, true]);
  });

  it('never shows a message to another workspace', async () => {
    const conversation = await seedConversation(testbed);
    const message = newMessage(testbed, conversation);
    await testbed.tenants.run(conversation.workspaceId, () =>
      testbed.messages.insertIfAbsent(message),
    );

    const fromOther = await testbed.tenants.run(testbed.ids.generate(), () =>
      testbed.messages.findById(conversation.workspaceId, message.id),
    );

    expect(fromOther).toBeNull();
  });
});
