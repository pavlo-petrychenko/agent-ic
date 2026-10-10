import type { DynamicModule } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AgentsRepository } from '@/modules/agents/repositories/agents.repository';
import type { PauseSettings } from '@/modules/agents/typedefs/pause-settings.typedefs';
import { ConversationsModule } from '@/modules/conversations/conversations.module';
import { ConversationsRepository } from '@/modules/conversations/repositories/conversations.repository';
import { MessagesRepository } from '@/modules/conversations/repositories/messages.repository';
import { ConversationHistoryService } from '@/modules/conversations/services/conversation-history.service';
import { ConversationRunsService } from '@/modules/conversations/services/conversation-runs.service';
import { IncomingMessagesService } from '@/modules/conversations/services/incoming-messages.service';
import type { NewConversation } from '@/modules/conversations/typedefs/conversation.typedefs';
import type { Message, NewMessage } from '@/modules/conversations/typedefs/message.typedefs';
import { ClockModule } from '@/platform/clock/clock.module';
import { ClockService } from '@/platform/clock/services/clock.service';
import { ConfigModule } from '@/platform/config/config.module';
import { EnvVar } from '@/platform/config/constants/env.constants';
import type { RoleSelection } from '@/platform/config/typedefs/app-config.typedefs';
import { ContextModule } from '@/platform/context/context.module';
import { DatabaseModule } from '@/platform/database/database.module';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { DOMAIN_EVENT_SUBSCRIPTIONS } from '@/platform/domain-events/constants/domain-event.constants';
import { DomainEventsModule } from '@/platform/domain-events/domain-events.module';
import type { AnyDomainEventSubscription } from '@/platform/domain-events/typedefs/domain-event.typedefs';
import { ErrorsModule } from '@/platform/errors/errors.module';
import { IdsModule } from '@/platform/ids/ids.module';
import { IdService } from '@/platform/ids/services/id.service';
import { QueuesModule } from '@/platform/queues/queues.module';
import { QueuesService } from '@/platform/queues/services/queues.service';
import type { JobData } from '@/platform/queues/typedefs/job.typedefs';
import {
  CONCURRENT_POOL_SIZE,
  CONVERSATIONS_TEST_START,
  CONVERSATIONS_TESTBED_ROLE,
  MESSAGE_SPACING_MS,
} from '@test/support/constants/conversations-testing.constants';
import { TestRedisPrefix } from '@test/support/constants/test-infrastructure.constants';
import { MissingTestDataError } from '@test/support/errors/missing-test-data.error';
import { ManualClock } from '@test/support/fakes/manual-clock.fake';
import { newAgent } from '@test/support/fixtures/agents.fixture';
import { newConversation, newMessage } from '@test/support/fixtures/conversation.fixture';
import { createIntegrationConfig } from '@test/support/fixtures/integration-env.fixture';
import {
  deliverOnOutboundQueued,
  notifyOnNeedsOperator,
  runOnMessageReceived,
} from '@test/support/jobs/conversation-probe.job';
import { AgentsNeighboursModule } from '@test/support/modules/agents-neighbours.module';
import type {
  ConversationsTestbed,
  TiedMessages,
} from '@test/support/typedefs/conversations-testing.typedefs';

export const createConversationsTestbed = async (
  domainModule: DynamicModule = ConversationsModule.forRole(CONVERSATIONS_TESTBED_ROLE),
  redisPrefix: TestRedisPrefix = TestRedisPrefix.Conversations,
  selection: RoleSelection = { role: CONVERSATIONS_TESTBED_ROLE, queues: [] },
): Promise<ConversationsTestbed> => {
  const config = createIntegrationConfig(selection, redisPrefix, {
    [EnvVar.DatabasePoolMax]: CONCURRENT_POOL_SIZE,
  });
  const clock = new ManualClock(CONVERSATIONS_TEST_START);
  const module = await Test.createTestingModule({
    imports: [
      ConfigModule.register(config),
      ContextModule,
      ErrorsModule,
      DatabaseModule,
      ClockModule,
      IdsModule,
      QueuesModule.forRole(selection.role),
      DomainEventsModule.forRole(selection.role),
      AgentsNeighboursModule.forRole(selection.role),
      domainModule,
    ],
    providers: [
      {
        provide: DOMAIN_EVENT_SUBSCRIPTIONS,
        useValue: [deliverOnOutboundQueued, notifyOnNeedsOperator, runOnMessageReceived],
      },
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
    runs: module.get(ConversationRunsService),
    incoming: module.get(IncomingMessagesService),
    agents: module.get(AgentsRepository),
    queues: module.get(QueuesService),
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

export const seedAgent = async (
  testbed: ConversationsTestbed,
  workspaceId: string,
  pause: PauseSettings | null = null,
): Promise<string> => {
  const agentId = testbed.ids.generate();
  await testbed.tenants.run(workspaceId, async () => {
    await testbed.agents.insert(newAgent(agentId, workspaceId));
    await testbed.agents.setPause(workspaceId, agentId, pause, testbed.clock.now());
  });
  return agentId;
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

export const queuedEventsFor = async (
  testbed: Pick<ConversationsTestbed, 'queues'>,
  subscription: AnyDomainEventSubscription,
  conversationId: string,
): Promise<JobData[]> => {
  const jobs = await testbed.queues.get(subscription.queue).getJobs();
  return jobs
    .filter((job) => job.name === subscription.name)
    .map((job) => job.data.data)
    .filter((data) => data['conversationId'] === conversationId);
};
