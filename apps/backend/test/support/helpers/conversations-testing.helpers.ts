import { Test } from '@nestjs/testing';
import { ConversationsModule } from '@/modules/conversations/conversations.module';
import { ConversationsRepository } from '@/modules/conversations/repositories/conversations.repository';
import { MessagesRepository } from '@/modules/conversations/repositories/messages.repository';
import { ConversationHistoryService } from '@/modules/conversations/services/conversation-history.service';
import type { NewConversation } from '@/modules/conversations/typedefs/conversation.typedefs';
import type { Message, NewMessage } from '@/modules/conversations/typedefs/message.typedefs';
import { ClockModule } from '@/platform/clock/clock.module';
import { ClockService } from '@/platform/clock/services/clock.service';
import { ConfigModule } from '@/platform/config/config.module';
import { EnvVar } from '@/platform/config/constants/env.constants';
import { loadAppConfig } from '@/platform/config/helpers/config.helpers';
import { ContextModule } from '@/platform/context/context.module';
import { DatabaseModule } from '@/platform/database/database.module';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { ErrorsModule } from '@/platform/errors/errors.module';
import { IdsModule } from '@/platform/ids/ids.module';
import { IdService } from '@/platform/ids/services/id.service';
import { Role } from '@/platform/module-roles/constants/role.constants';
import {
  CONCURRENT_POOL_SIZE,
  CONVERSATIONS_TEST_START,
  MESSAGE_SPACING_MS,
} from '@test/support/constants/conversations-testing.constants';
import { TestRedisDatabase } from '@test/support/constants/test-infrastructure.constants';
import { MissingTestDataError } from '@test/support/errors/missing-test-data.error';
import { ManualClock } from '@test/support/fakes/manual-clock.fake';
import { newConversation, newMessage } from '@test/support/fixtures/conversation.fixture';
import { createIntegrationTestEnv } from '@test/support/fixtures/integration-env.fixture';
import type {
  ConversationsTestbed,
  TiedMessages,
} from '@test/support/typedefs/conversations-testing.typedefs';

const ROLE = Role.Api;

export const createConversationsTestbed = async (): Promise<ConversationsTestbed> => {
  const config = loadAppConfig(
    { role: ROLE, queues: [] },
    createIntegrationTestEnv(TestRedisDatabase.Database, {
      [EnvVar.DatabasePoolMax]: CONCURRENT_POOL_SIZE,
    }),
  );
  const clock = new ManualClock(CONVERSATIONS_TEST_START);
  const module = await Test.createTestingModule({
    imports: [
      ConfigModule.register(config),
      ContextModule,
      ErrorsModule,
      DatabaseModule,
      ClockModule,
      IdsModule,
      ConversationsModule.forRole(ROLE),
    ],
  })
    .overrideProvider(ClockService)
    .useValue(clock)
    .compile();
  module.useLogger(false);
  await module.init();
  return {
    module,
    clock,
    ids: module.get(IdService),
    tenants: module.get(TenantTransactionService),
    conversations: module.get(ConversationsRepository),
    messages: module.get(MessagesRepository),
    history: module.get(ConversationHistoryService),
  };
};

export const seedConversation = async (
  testbed: ConversationsTestbed,
  workspaceId: string = testbed.ids.generate(),
): Promise<NewConversation> => {
  const conversation = newConversation(testbed, workspaceId);
  await testbed.tenants.run(conversation.workspaceId, () =>
    testbed.conversations.insert(conversation),
  );
  return conversation;
};

export const seedMessage = async (
  testbed: ConversationsTestbed,
  conversation: NewConversation,
  draft: Partial<NewMessage> = {},
): Promise<Message> => {
  testbed.clock.advanceBy(MESSAGE_SPACING_MS);
  const message = await testbed.tenants.run(conversation.workspaceId, () =>
    testbed.messages.insertIfAbsent(newMessage(testbed, conversation, draft)),
  );
  if (message === null) {
    throw new MissingTestDataError(conversation.id);
  }
  return message;
};

export const seedTiedMessages = async (
  testbed: ConversationsTestbed,
  conversation: NewConversation,
): Promise<TiedMessages> => {
  const tie = { createdAt: testbed.clock.now() };
  const seeded = [
    await seedMessage(testbed, conversation, tie),
    await seedMessage(testbed, conversation, tie),
    await seedMessage(testbed, conversation, tie),
  ];
  const [earlier, middle, later] = seeded.sort((left, right) => (left.id < right.id ? -1 : 1));
  if (earlier === undefined || middle === undefined || later === undefined) {
    throw new MissingTestDataError(conversation.id);
  }
  return { earlier, middle, later };
};
