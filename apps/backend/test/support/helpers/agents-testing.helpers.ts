import { IdPrefix, WorkspaceRole } from '@agent-ic/contracts';
import type { FlowDocument } from '@agent-ic/flow';
import type { TestingModule } from '@nestjs/testing';
import { AgentsModule } from '@/modules/agents/agents.module';
import { AgentVersionsRepository } from '@/modules/agents/repositories/agent-versions.repository';
import { AgentsRepository } from '@/modules/agents/repositories/agents.repository';
import type { AgentVersion } from '@/modules/agents/typedefs/agent-version.typedefs';
import type { Agent } from '@/modules/agents/typedefs/agent.typedefs';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { IdService } from '@/platform/ids/services/id.service';
import { Role } from '@/platform/module-roles/constants/role.constants';
import { AGENTS_TEST_START } from '@test/support/constants/agents-testing.constants';
import { TestRedisDatabase } from '@test/support/constants/test-infrastructure.constants';
import { newAgent, newVersion, triggerFlow } from '@test/support/fixtures/agents.fixture';
import { workspaceCtx } from '@test/support/fixtures/workspace.fixture';
import { createPlatformTestingModule } from '@test/support/helpers/database-testing.helpers';
import type { SeededAgent } from '@test/support/typedefs/agents-testing.typedefs';

export const createAgentsTestingModule = (): Promise<TestingModule> =>
  createPlatformTestingModule(TestRedisDatabase.Agents, [AgentsModule.forRole(Role.Gateway)]);

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
