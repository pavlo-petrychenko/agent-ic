import type { FlowDocument } from '@agent-ic/flow';
import type { TestingModule } from '@nestjs/testing';
import { AgentsModule } from '@/modules/agents/agents.module';
import { AgentVersionsRepository } from '@/modules/agents/repositories/agent-versions.repository';
import { AgentsRepository } from '@/modules/agents/repositories/agents.repository';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { IdService } from '@/platform/ids/services/id.service';
import { Role } from '@/platform/module-roles/constants/role.constants';
import { AGENTS_TEST_START } from '@test/support/constants/agents-testing.constants';
import { TestRedisDatabase } from '@test/support/constants/test-infrastructure.constants';
import { newAgent, newVersion, triggerFlow } from '@test/support/fixtures/agents.fixture';
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
