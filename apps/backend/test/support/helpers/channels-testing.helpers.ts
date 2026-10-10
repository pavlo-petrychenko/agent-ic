import { ChannelsModule } from '@/modules/channels/channels.module';
import { SimulatedChannelAdapter } from '@/modules/channels/gateways/simulated-channel-adapter.gateway';
import { DeliverOutboundMessageUseCase } from '@/modules/channels/use-cases/deliver-outbound-message.use-case';
import { MessageAuthor } from '@/modules/conversations/constants/message.constants';
import type { NewConversation } from '@/modules/conversations/typedefs/conversation.typedefs';
import type { Message } from '@/modules/conversations/typedefs/message.typedefs';
import {
  AGENT_REPLY_TEXT,
  CONVERSATIONS_TESTBED_ROLE,
  QUICK_REPLIES,
  TEST_IDEMPOTENCY_KEY,
} from '@test/support/constants/conversations-testing.constants';
import { TestRedisPrefix } from '@test/support/constants/test-infrastructure.constants';
import { newConversation, workspaceSystemCtx } from '@test/support/fixtures/conversation.fixture';
import { createConversationsTestbed } from '@test/support/helpers/conversations-testing.helpers';
import type { ChannelsTestbed } from '@test/support/typedefs/channels-testing.typedefs';

export const createChannelsTestbed = async (): Promise<ChannelsTestbed> => {
  const testbed = await createConversationsTestbed(
    ChannelsModule.forRole(CONVERSATIONS_TESTBED_ROLE),
    TestRedisPrefix.Channels,
  );
  return {
    ...testbed,
    deliver: testbed.module.get(DeliverOutboundMessageUseCase),
    simulated: testbed.module.get(SimulatedChannelAdapter),
  };
};

export const seedChannelConversation = async (
  testbed: ChannelsTestbed,
  overrides: Partial<NewConversation> = {},
): Promise<NewConversation> => {
  const conversation = { ...newConversation(testbed, testbed.ids.generate()), ...overrides };
  await testbed.tenants.run(conversation.workspaceId, () =>
    testbed.conversations.insert(conversation),
  );
  return conversation;
};

export const queueAgentReply = (
  testbed: ChannelsTestbed,
  conversation: NewConversation,
): Promise<Message> =>
  testbed.tenants.run(conversation.workspaceId, () =>
    testbed.runs.recordOutbound(workspaceSystemCtx(conversation.workspaceId), {
      workspaceId: conversation.workspaceId,
      conversationId: conversation.id,
      key: `${TEST_IDEMPOTENCY_KEY}:${conversation.id}`,
      author: MessageAuthor.Agent,
      text: AGENT_REPLY_TEXT,
      quickReplies: QUICK_REPLIES,
      runId: testbed.ids.generate(),
    }),
  );

export const deliveryOf = async (
  testbed: ChannelsTestbed,
  message: Message,
): Promise<Message | null> =>
  testbed.tenants.run(message.workspaceId, () =>
    testbed.messages.findById(message.workspaceId, message.id),
  );

export const deliverOutbound = (
  testbed: ChannelsTestbed,
  conversation: NewConversation,
  message: Message,
): Promise<void> =>
  testbed.deliver.execute(workspaceSystemCtx(conversation.workspaceId), {
    conversationId: conversation.id,
    messageId: message.id,
    channelKind: conversation.channelKind,
    mode: conversation.mode,
  });
