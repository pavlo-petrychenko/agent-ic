import { Test } from '@nestjs/testing';
import { ConversationsModule } from '@/modules/conversations/conversations.module';
import { ConversationsRepository } from '@/modules/conversations/repositories/conversations.repository';
import { MessagesRepository } from '@/modules/conversations/repositories/messages.repository';
import type { NewConversation } from '@/modules/conversations/typedefs/conversation.typedefs';
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
} from '@test/support/constants/conversations-testing.constants';
import { TestRedisDatabase } from '@test/support/constants/test-infrastructure.constants';
import { ManualClock } from '@test/support/fakes/manual-clock.fake';
import { newConversation } from '@test/support/fixtures/conversation.fixture';
import { createIntegrationTestEnv } from '@test/support/fixtures/integration-env.fixture';
import type { ConversationsTestbed } from '@test/support/typedefs/conversations-testing.typedefs';

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
  };
};

export const seedConversation = async (testbed: ConversationsTestbed): Promise<NewConversation> => {
  const conversation = newConversation(testbed, testbed.ids.generate());
  await testbed.tenants.run(conversation.workspaceId, () =>
    testbed.conversations.insert(conversation),
  );
  return conversation;
};
