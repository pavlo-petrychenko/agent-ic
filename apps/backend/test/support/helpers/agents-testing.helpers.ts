import { IdPrefix, Locale, WorkspaceRole } from '@agent-ic/contracts';
import type { FlowDocument } from '@agent-ic/flow';
import type { DynamicModule } from '@nestjs/common';
import type { TestingModule } from '@nestjs/testing';
import { AgentsModule } from '@/modules/agents/agents.module';
import { AgentVersionKind } from '@/modules/agents/constants/agent.constants';
import { AgentVersionsRepository } from '@/modules/agents/repositories/agent-versions.repository';
import { AgentsRepository } from '@/modules/agents/repositories/agents.repository';
import type {
  AgentVersion,
  NewAgentVersion,
} from '@/modules/agents/typedefs/agent-version.typedefs';
import type { Agent } from '@/modules/agents/typedefs/agent.typedefs';
import {
  ChannelKind,
  ConversationMode,
  ConversationState,
} from '@/modules/conversations/constants/conversation.constants';
import { MessageAuthor } from '@/modules/conversations/constants/message.constants';
import { ConversationsRepository } from '@/modules/conversations/repositories/conversations.repository';
import { MessagesRepository } from '@/modules/conversations/repositories/messages.repository';
import { UsersRepository } from '@/modules/identity/repositories/users.repository';
import { ClockService } from '@/platform/clock/services/clock.service';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { IdService } from '@/platform/ids/services/id.service';
import { Role } from '@/platform/module-roles/constants/role.constants';
import { OutboundHttpModule } from '@/platform/outbound-http/outbound-http.module';
import { RateLimitModule } from '@/platform/rate-limit/rate-limit.module';
import { RedisModule } from '@/platform/redis/redis.module';
import {
  AGENTS_TEST_START,
  TEST_AUTHOR_NAME,
  TEST_AUTHOR_PASSWORD_HASH,
  TEST_EDITOR_ID,
} from '@test/support/constants/agents-testing.constants';
import {
  TEST_END_USER_EXTERNAL_ID,
  TEST_MESSAGE_TEXT,
} from '@test/support/constants/conversations-testing.constants';
import { CLOCK_TICK_MS } from '@test/support/constants/manual-clock.constants';
import { TEST_PUBLISHED_NUMBER } from '@test/support/constants/runs-testing.constants';
import { TestRedisPrefix } from '@test/support/constants/test-infrastructure.constants';
import { ManualClock } from '@test/support/fakes/manual-clock.fake';
import { newAgent, newVersion, triggerFlow } from '@test/support/fixtures/agents.fixture';
import { uniqueEmail } from '@test/support/fixtures/identity.fixture';
import { workspaceCtx } from '@test/support/fixtures/workspace.fixture';
import { createPlatformTestingModule } from '@test/support/helpers/database-testing.helpers';
import { manualClockOf } from '@test/support/helpers/manual-clock.helpers';
import { ensureWorkspaceRow } from '@test/support/helpers/parent-rows.helpers';
import { AgentsNeighboursModule } from '@test/support/modules/agents-neighbours.module';
import type {
  SeededAgent,
  SeededConversation,
  StoredConversation,
} from '@test/support/typedefs/agents-testing.typedefs';

export const createAgentsTestingModule = (
  imports: readonly DynamicModule[] = [],
): Promise<TestingModule> =>
  createPlatformTestingModule(
    TestRedisPrefix.Agents,
    [
      RedisModule,
      RateLimitModule,
      OutboundHttpModule,
      AgentsNeighboursModule.forRole(Role.Gateway),
      AgentsModule.forRole(Role.Gateway),
      ...imports,
    ],
    [{ token: ClockService, value: new ManualClock(AGENTS_TEST_START) }],
  );

export const seedAgentWithDraft = async (
  testingModule: TestingModule,
  workspaceId: string,
  flow: FlowDocument = triggerFlow(),
): Promise<SeededAgent> => {
  const agents = testingModule.get(AgentsRepository);
  const versions = testingModule.get(AgentVersionsRepository);
  const tenants = testingModule.get(TenantTransactionService);
  const ids = testingModule.get(IdService);
  manualClockOf(testingModule).advanceBy(CLOCK_TICK_MS);
  const agentId = ids.generate();
  const draftId = ids.generate();
  await ensureWorkspaceRow(testingModule, workspaceId);
  await tenants.run(workspaceId, async () => {
    await agents.insert(newAgent(agentId, workspaceId));
    await versions.insert(newVersion(draftId, workspaceId, agentId, { flow }));
    await agents.setDraftVersion(workspaceId, agentId, draftId);
  });
  return { agentId, draftId };
};

export const seedAgentVersion = async (
  testingModule: TestingModule,
  workspaceId: string,
  agentId: string,
  version: Partial<NewAgentVersion> = {},
): Promise<string> => {
  const versionId = testingModule.get(IdService).generate();
  await testingModule
    .get(TenantTransactionService)
    .run(workspaceId, () =>
      testingModule
        .get(AgentVersionsRepository)
        .insert(newVersion(versionId, workspaceId, agentId, version)),
    );
  return versionId;
};

export const seedPublishedVersion = (
  testingModule: TestingModule,
  workspaceId: string,
  agentId: string,
  version: Partial<NewAgentVersion> = {},
): Promise<string> =>
  seedAgentVersion(testingModule, workspaceId, agentId, {
    kind: AgentVersionKind.Published,
    number: TEST_PUBLISHED_NUMBER,
    ...version,
  });

export const agentsCtx = (
  testingModule: TestingModule,
  workspaceId: string,
  role: WorkspaceRole = WorkspaceRole.Owner,
): UseCaseCtx => workspaceCtx(TEST_EDITOR_ID, workspaceId, role);

export const publicAgentId = (testingModule: TestingModule, agentId: string): string =>
  testingModule.get(IdService).toPublic(IdPrefix.Agent, agentId);

export const makeAgentLive = async (
  testingModule: TestingModule,
  workspaceId: string,
  seeded: SeededAgent,
): Promise<void> => {
  await makeVersionLive(testingModule, workspaceId, seeded.agentId, seeded.draftId);
};

export const makeVersionLive = async (
  testingModule: TestingModule,
  workspaceId: string,
  agentId: string,
  versionId: string,
): Promise<void> => {
  await testingModule
    .get(TenantTransactionService)
    .run(workspaceId, () =>
      testingModule.get(AgentsRepository).setLiveVersion(workspaceId, agentId, versionId),
    );
};

export const deleteAgent = async (
  testingModule: TestingModule,
  workspaceId: string,
  agentId: string,
): Promise<void> => {
  await testingModule
    .get(TenantTransactionService)
    .run(workspaceId, () =>
      testingModule.get(AgentsRepository).delete(workspaceId, agentId, AGENTS_TEST_START),
    );
};

export const readAgent = (
  testingModule: TestingModule,
  workspaceId: string,
  agentId: string,
): Promise<Agent | null> =>
  testingModule
    .get(TenantTransactionService)
    .run(workspaceId, () => testingModule.get(AgentsRepository).findById(workspaceId, agentId));

export const readVersions = (
  testingModule: TestingModule,
  workspaceId: string,
  agentId: string,
): Promise<AgentVersion[]> =>
  testingModule
    .get(TenantTransactionService)
    .run(workspaceId, () =>
      testingModule.get(AgentVersionsRepository).listByAgent(workspaceId, agentId),
    );

export const seedAuthor = async (testingModule: TestingModule): Promise<string> => {
  const userId = testingModule.get(IdService).generate();
  await testingModule.get(UsersRepository).upsertUnconfirmed({
    id: userId,
    email: uniqueEmail(),
    name: TEST_AUTHOR_NAME,
    passwordHash: TEST_AUTHOR_PASSWORD_HASH,
    locale: Locale.En,
  });
  return userId;
};

export const seedAgentConversation = async (
  testingModule: TestingModule,
  workspaceId: string,
  agentId: string,
): Promise<SeededConversation> => {
  const ids = testingModule.get(IdService);
  const conversationId = ids.generate();
  const messageId = ids.generate();
  await testingModule.get(TenantTransactionService).run(workspaceId, async () => {
    await testingModule.get(ConversationsRepository).insert({
      id: conversationId,
      workspaceId,
      agentId,
      mode: ConversationMode.Live,
      channelKind: ChannelKind.Simulated,
      endUserExternalId: TEST_END_USER_EXTERNAL_ID,
      state: ConversationState.AgentActive,
      lastMessageAt: AGENTS_TEST_START,
    });
    await testingModule.get(MessagesRepository).insertIfAbsent({
      id: messageId,
      workspaceId,
      conversationId,
      author: MessageAuthor.Customer,
      text: TEST_MESSAGE_TEXT,
      quickReplies: [],
    });
  });
  return { conversationId, messageId };
};

export const readAgentConversation = (
  testingModule: TestingModule,
  workspaceId: string,
  seeded: SeededConversation,
): Promise<StoredConversation> =>
  testingModule.get(TenantTransactionService).run(workspaceId, async () => ({
    conversation: await testingModule
      .get(ConversationsRepository)
      .findById(workspaceId, seeded.conversationId),
    message: await testingModule.get(MessagesRepository).findById(workspaceId, seeded.messageId),
  }));
