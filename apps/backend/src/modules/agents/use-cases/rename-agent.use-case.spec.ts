import { WorkspaceRole } from '@agent-ic/contracts';
import type { TestingModule } from '@nestjs/testing';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AgentNotFoundError } from '@/modules/agents/errors/agent-not-found.error';
import { InvalidAgentInputError } from '@/modules/agents/errors/invalid-agent-input.error';
import { AgentsRepository } from '@/modules/agents/repositories/agents.repository';
import { RenameAgentUseCase } from '@/modules/agents/use-cases/rename-agent.use-case';
import { PermissionDeniedError } from '@/platform/context/errors/permission-denied.error';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { IdService } from '@/platform/ids/services/id.service';
import { TEST_AGENT_NEW_NAME } from '@test/support/constants/agents-testing.constants';
import {
  agentsCtx,
  createAgentsTestingModule,
  publicAgentId,
  seedAgentWithDraft,
} from '@test/support/helpers/agents-testing.helpers';

describe('RenameAgentUseCase', () => {
  let testingModule: TestingModule;
  let renameAgent: RenameAgentUseCase;
  let ids: IdService;

  beforeAll(async () => {
    testingModule = await createAgentsTestingModule();
    renameAgent = testingModule.get(RenameAgentUseCase);
    ids = testingModule.get(IdService);
  });

  afterAll(async () => {
    await testingModule.close();
  });

  it('renames the agent and stores the new name', async () => {
    const workspaceId = ids.generate();
    const { agentId } = await seedAgentWithDraft(testingModule, workspaceId);

    const view = await renameAgent.execute(agentsCtx(testingModule, workspaceId), {
      id: publicAgentId(testingModule, agentId),
      name: TEST_AGENT_NEW_NAME,
    });

    const stored = await testingModule
      .get(TenantTransactionService)
      .run(workspaceId, () => testingModule.get(AgentsRepository).findById(workspaceId, agentId));
    expect(view.name).toBe(TEST_AGENT_NEW_NAME);
    expect(stored?.name).toBe(TEST_AGENT_NEW_NAME);
  });

  it('does not find an agent of another workspace', async () => {
    const { agentId } = await seedAgentWithDraft(testingModule, ids.generate());

    const attempt = renameAgent.execute(agentsCtx(testingModule, ids.generate()), {
      id: publicAgentId(testingModule, agentId),
      name: TEST_AGENT_NEW_NAME,
    });

    await expect(attempt).rejects.toBeInstanceOf(AgentNotFoundError);
  });

  it('rejects an empty name', async () => {
    const workspaceId = ids.generate();
    const { agentId } = await seedAgentWithDraft(testingModule, workspaceId);

    const attempt = renameAgent.execute(agentsCtx(testingModule, workspaceId), {
      id: publicAgentId(testingModule, agentId),
      name: ' ',
    });

    await expect(attempt).rejects.toBeInstanceOf(InvalidAgentInputError);
  });

  it('refuses an operator', async () => {
    const workspaceId = ids.generate();
    const { agentId } = await seedAgentWithDraft(testingModule, workspaceId);

    const attempt = renameAgent.execute(
      agentsCtx(testingModule, workspaceId, WorkspaceRole.Operator),
      { id: publicAgentId(testingModule, agentId), name: TEST_AGENT_NEW_NAME },
    );

    await expect(attempt).rejects.toBeInstanceOf(PermissionDeniedError);
  });
});
