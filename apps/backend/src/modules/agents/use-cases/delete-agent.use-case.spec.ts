import { WorkspaceRole } from '@agent-ic/contracts';
import type { TestingModule } from '@nestjs/testing';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AgentIsLiveError } from '@/modules/agents/errors/agent-is-live.error';
import { AgentNotFoundError } from '@/modules/agents/errors/agent-not-found.error';
import { AgentVersionsRepository } from '@/modules/agents/repositories/agent-versions.repository';
import { AgentsRepository } from '@/modules/agents/repositories/agents.repository';
import { DeleteAgentUseCase } from '@/modules/agents/use-cases/delete-agent.use-case';
import { PermissionDeniedError } from '@/platform/context/errors/permission-denied.error';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { IdService } from '@/platform/ids/services/id.service';
import {
  agentsCtx,
  createAgentsTestingModule,
  makeAgentLive,
  publicAgentId,
  seedAgentWithDraft,
} from '@test/support/helpers/agents-testing.helpers';

describe('DeleteAgentUseCase', () => {
  let testingModule: TestingModule;
  let deleteAgent: DeleteAgentUseCase;
  let tenants: TenantTransactionService;
  let ids: IdService;

  beforeAll(async () => {
    testingModule = await createAgentsTestingModule();
    deleteAgent = testingModule.get(DeleteAgentUseCase);
    tenants = testingModule.get(TenantTransactionService);
    ids = testingModule.get(IdService);
  });

  afterAll(async () => {
    await testingModule.close();
  });

  it('deletes an agent that is not live together with its versions', async () => {
    const workspaceId = ids.generate();
    const { agentId } = await seedAgentWithDraft(testingModule, workspaceId);
    const id = publicAgentId(testingModule, agentId);

    const result = await deleteAgent.execute(agentsCtx(testingModule, workspaceId), { id });

    const agent = await tenants.run(workspaceId, () =>
      testingModule.get(AgentsRepository).findById(workspaceId, agentId),
    );
    const versions = await tenants.run(workspaceId, () =>
      testingModule.get(AgentVersionsRepository).listByAgent(workspaceId, agentId),
    );
    expect(result).toEqual({ id });
    expect(agent).toBeNull();
    expect(versions).toEqual([]);
  });

  it('refuses to delete a live agent', async () => {
    const workspaceId = ids.generate();
    const seeded = await seedAgentWithDraft(testingModule, workspaceId);
    await makeAgentLive(testingModule, workspaceId, seeded);

    const attempt = deleteAgent.execute(agentsCtx(testingModule, workspaceId), {
      id: publicAgentId(testingModule, seeded.agentId),
    });

    await expect(attempt).rejects.toBeInstanceOf(AgentIsLiveError);
    const agent = await tenants.run(workspaceId, () =>
      testingModule.get(AgentsRepository).findById(workspaceId, seeded.agentId),
    );
    expect(agent).not.toBeNull();
  });

  it('does not find an agent of another workspace', async () => {
    const { agentId } = await seedAgentWithDraft(testingModule, ids.generate());

    const attempt = deleteAgent.execute(agentsCtx(testingModule, ids.generate()), {
      id: publicAgentId(testingModule, agentId),
    });

    await expect(attempt).rejects.toBeInstanceOf(AgentNotFoundError);
  });

  it('refuses an operator', async () => {
    const workspaceId = ids.generate();
    const { agentId } = await seedAgentWithDraft(testingModule, workspaceId);

    const attempt = deleteAgent.execute(
      agentsCtx(testingModule, workspaceId, WorkspaceRole.Operator),
      { id: publicAgentId(testingModule, agentId) },
    );

    await expect(attempt).rejects.toBeInstanceOf(PermissionDeniedError);
  });
});
