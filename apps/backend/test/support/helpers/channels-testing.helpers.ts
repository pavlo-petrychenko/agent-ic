import { ChannelsModule } from '@/modules/channels/channels.module';
import { SimulatedChannelAdapter } from '@/modules/channels/gateways/simulated-channel-adapter.gateway';
import { FakeTelegramGateway } from '@/modules/channels/gateways/telegram.fake';
import { TelegramGateway } from '@/modules/channels/gateways/telegram.gateway';
import { ChannelEventsRepository } from '@/modules/channels/repositories/channel-events.repository';
import { ChannelsRepository } from '@/modules/channels/repositories/channels.repository';
import { ChannelTokenService } from '@/modules/channels/services/channel-token.service';
import { DeliverOutboundMessageUseCase } from '@/modules/channels/use-cases/deliver-outbound-message.use-case';
import { MessageAuthor } from '@/modules/conversations/constants/message.constants';
import type { NewConversation } from '@/modules/conversations/typedefs/conversation.typedefs';
import type { Message } from '@/modules/conversations/typedefs/message.typedefs';
import { Role } from '@/platform/module-roles/constants/role.constants';
import { QueueName } from '@/platform/queues/constants/queue.constants';
import {
  AGENT_REPLY_TEXT,
  CONVERSATIONS_TESTBED_ROLE,
  QUICK_REPLIES,
  TEST_IDEMPOTENCY_KEY,
} from '@test/support/constants/conversations-testing.constants';
import { TestRedisPrefix } from '@test/support/constants/test-infrastructure.constants';
import { newConversation, workspaceSystemCtx } from '@test/support/fixtures/conversation.fixture';
import { createConversationsTestbed } from '@test/support/helpers/conversations-testing.helpers';
import {
  ensureAgentRow,
  ensureUserRow,
  ensureWorkspaceRow,
  seedRunRow,
} from '@test/support/helpers/parent-rows.helpers';
import type { ChannelsTestbed } from '@test/support/typedefs/channels-testing.typedefs';

export const createChannelsTestbed = async (): Promise<ChannelsTestbed> => {
  const telegram = new FakeTelegramGateway();
  const testbed = await createConversationsTestbed(
    ChannelsModule.forRole(CONVERSATIONS_TESTBED_ROLE),
    TestRedisPrefix.Channels,
    { role: CONVERSATIONS_TESTBED_ROLE, queues: [] },
    [{ token: TelegramGateway, value: telegram }],
  );
  return {
    ...testbed,
    deliver: testbed.module.get(DeliverOutboundMessageUseCase),
    simulated: testbed.module.get(SimulatedChannelAdapter),
    telegram,
    channels: testbed.module.get(ChannelsRepository),
    channelEvents: testbed.module.get(ChannelEventsRepository),
    channelTokens: testbed.module.get(ChannelTokenService),
  };
};

export const createChannelsWorkerTestbed = async (): Promise<ChannelsTestbed> => {
  const telegram = new FakeTelegramGateway();
  const testbed = await createConversationsTestbed(
    ChannelsModule.forRole(Role.Worker),
    TestRedisPrefix.ChannelsWorker,
    { role: Role.Worker, queues: [QueueName.Outbound] },
    [{ token: TelegramGateway, value: telegram }],
  );
  return {
    ...testbed,
    deliver: testbed.module.get(DeliverOutboundMessageUseCase),
    simulated: testbed.module.get(SimulatedChannelAdapter),
    telegram,
    channels: testbed.module.get(ChannelsRepository),
    channelEvents: testbed.module.get(ChannelEventsRepository),
    channelTokens: testbed.module.get(ChannelTokenService),
  };
};

export const seedChannelWorkspace = async (
  testbed: ChannelsTestbed,
): Promise<{ readonly workspaceId: string; readonly userId: string }> => {
  const workspaceId = testbed.ids.generate();
  const userId = testbed.ids.generate();
  await ensureWorkspaceRow(testbed.module, workspaceId);
  await ensureUserRow(testbed.module, userId);
  return { workspaceId, userId };
};

export const seedChannelConversation = async (
  testbed: ChannelsTestbed,
  overrides: Partial<NewConversation> = {},
): Promise<NewConversation> => {
  const conversation = { ...newConversation(testbed, testbed.ids.generate()), ...overrides };
  await ensureAgentRow(testbed.module, conversation.workspaceId, conversation.agentId);
  await testbed.tenants.run(conversation.workspaceId, () =>
    testbed.conversations.insert(conversation),
  );
  return conversation;
};

export const queueAgentReply = async (
  testbed: ChannelsTestbed,
  conversation: NewConversation,
): Promise<Message> => {
  const runId = await seedRunRow(testbed.module, conversation);
  return testbed.tenants.run(conversation.workspaceId, () =>
    testbed.runs.recordOutbound(workspaceSystemCtx(conversation.workspaceId), {
      workspaceId: conversation.workspaceId,
      conversationId: conversation.id,
      key: `${TEST_IDEMPOTENCY_KEY}:${conversation.id}`,
      author: MessageAuthor.Agent,
      text: AGENT_REPLY_TEXT,
      quickReplies: QUICK_REPLIES,
      runId,
    }),
  );
};

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
