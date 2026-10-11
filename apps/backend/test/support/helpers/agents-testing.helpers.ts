import { IdPrefix, Locale, WorkspaceRole } from '@agent-ic/contracts';
import type { FlowDocument } from '@agent-ic/flow';
import type { TestingModule } from '@nestjs/testing';
import { AgentsModule } from '@/modules/agents/agents.module';
import { AgentVersionsRepository } from '@/modules/agents/repositories/agent-versions.repository';
import { AgentsRepository } from '@/modules/agents/repositories/agents.repository';
import type { AgentVersion } from '@/modules/agents/typedefs/agent-version.typedefs';
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
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { IdService } from '@/platform/ids/services/id.service';
import { Role } from '@/platform/module-roles/constants/role.constants';
import {
  AGENTS_TEST_START,
  TEST_AUTHOR_NAME,
  TEST_AUTHOR_PASSWORD_HASH,
} from '@test/support/constants/agents-testing.constants';
import {
  TEST_END_USER_EXTERNAL_ID,
  TEST_MESSAGE_TEXT,
} from '@test/support/constants/conversations-testing.constants';
import { TestRedisPrefix } from '@test/support/constants/test-infrastructure.constants';
import { newAgent, newVersion, triggerFlow } from '@test/support/fixtures/agents.fixture';
import { uniqueEmail } from '@test/support/fixtures/identity.fixture';
import { workspaceCtx } from '@test/support/fixtures/workspace.fixture';
import { createPlatformTestingModule } from '@test/support/helpers/database-testing.helpers';
import { AgentsNeighboursModule } from '@test/support/modules/agents-neighbours.module';
import type {
  SeededAgent,
  SeededConversation,
  StoredConversation,
} from '@test/support/typedefs/agents-testing.typedefs';

export const createAgentsTestingModule = (): Promise<TestingModule> =>
  createPlatformTestingModule(TestRedisPrefix.Agents, [
    AgentsNeighboursModule.forRole(Role.Gateway),
    AgentsModule.forRole(Role.Gateway),
  ]);

export const seedAgentWithDraft = async (
  testingModule: TestingModule,
  workspaceId: string,
  flow: FlowDocument = triggerFlow(),
): Promise<SeededAgent> => {
  const agents = testingModule.get(AgentsRepository);
  const versions = testingModule.get(AgentVersionsRepository);
  const tenants = testingModule.get(TenantTransactionService);
  const ids = testingModule.get(IdService);
  const agentId = ids.generate();
  const draftId = ids.generate();
  await tenants.run(workspaceId, async () => {
    await agents.insert(newAgent(agentId, workspaceId));
    await versions.insert(newVersion(draftId, workspaceId, agentId, { flow }));
    await agents.setDraftVersion(workspaceId, agentId, draftId, AGENTS_TEST_START);
  });
  return { agentId, draftId };
};

export const agentsCtx = (
  testingModule: TestingModule,
  workspaceId: string,
  role: WorkspaceRole = WorkspaceRole.Owner,
): UseCaseCtx => workspaceCtx(testingModule.get(IdService).generate(), workspaceId, role);

export const publicAgentId = (testingModule: TestingModule, agentId: string): string =>
  testingModule.get(IdService).toPublic(IdPrefix.Agent, agentId);

export const makeAgentLive = async (
  testingModule: TestingModule,
  workspaceId: string,
  seeded: SeededAgent,
): Promise<void> => {
  await testingModule
    .get(TenantTransactionService)
    .run(workspaceId, () =>
      testingModule
        .get(AgentsRepository)
        .setLiveVersion(workspaceId, seeded.agentId, seeded.draftId, AGENTS_TEST_START),
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
    createdAt: AGENTS_TEST_START,
    updatedAt: AGENTS_TEST_START,
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
      createdAt: AGENTS_TEST_START,
    });
    await testingModule.get(MessagesRepository).insertIfAbsent({
      id: messageId,
      workspaceId,
      conversationId,
      author: MessageAuthor.Customer,
      text: TEST_MESSAGE_TEXT,
      quickReplies: [],
      createdAt: AGENTS_TEST_START,
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
