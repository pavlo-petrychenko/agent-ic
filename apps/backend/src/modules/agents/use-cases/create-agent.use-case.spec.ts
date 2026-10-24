import { IdPrefix, WorkspaceRole } from '@agent-ic/contracts';
import { NodeType, flowDocumentSchema } from '@agent-ic/flow';
import type { TestingModule } from '@nestjs/testing';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AgentStatus } from '@/modules/agents/constants/agent.constants';
import { InvalidAgentInputError } from '@/modules/agents/errors/invalid-agent-input.error';
import { AgentVersionsRepository } from '@/modules/agents/repositories/agent-versions.repository';
import { AgentsRepository } from '@/modules/agents/repositories/agents.repository';
import { CreateAgentUseCase } from '@/modules/agents/use-cases/create-agent.use-case';
import { PermissionDeniedError } from '@/platform/context/errors/permission-denied.error';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { IdService } from '@/platform/ids/services/id.service';
import { TEST_AGENT_NAME } from '@test/support/constants/agents-testing.constants';
import { agentsCtx, createAgentsTestingModule } from '@test/support/helpers/agents-testing.helpers';
import { ensureWorkspaceRow } from '@test/support/helpers/parent-rows.helpers';

const PADDED_NAME = `  ${TEST_AGENT_NAME}  `;
const CONCURRENT_CREATES = 3;

describe('CreateAgentUseCase', () => {
  let testingModule: TestingModule;
  let createAgent: CreateAgentUseCase;
  let ids: IdService;

  beforeAll(async () => {
    testingModule = await createAgentsTestingModule();
    createAgent = testingModule.get(CreateAgentUseCase);
    ids = testingModule.get(IdService);
  });

  afterAll(async () => {
    await testingModule.close();
  });

  it('creates a draft agent with a draft version holding only a trigger node', async () => {
    const workspaceId = ids.generate();
    await ensureWorkspaceRow(testingModule, workspaceId);
    const ctx = agentsCtx(testingModule, workspaceId, WorkspaceRole.Builder);

    const view = await createAgent.execute(ctx, { name: PADDED_NAME });

    const agentId = ids.fromPublic(IdPrefix.Agent, view.id);
    const tenants = testingModule.get(TenantTransactionService);
    const agent = await tenants.run(workspaceId, () =>
      testingModule.get(AgentsRepository).findById(workspaceId, agentId),
    );
    const draft = await tenants.run(workspaceId, () =>
      testingModule.get(AgentVersionsRepository).findDraft(workspaceId, agentId),
    );
    expect(view).toMatchObject({ name: TEST_AGENT_NAME, status: AgentStatus.Draft });
    expect(agent).toMatchObject({ name: TEST_AGENT_NAME, draftVersionId: draft?.id });
    expect(agent?.liveVersionId).toBeNull();
    expect(draft?.authorId).toEqual(expect.any(String));
    expect(flowDocumentSchema.safeParse(draft?.flow).success).toBe(true);
    expect(draft?.flow.nodes.map((node) => node.type)).toEqual([NodeType.TriggerMessage]);
    expect(draft?.flow.edges).toEqual([]);
  });

  it('numbers a name already used in the workspace', async () => {
    const workspaceId = ids.generate();
    await ensureWorkspaceRow(testingModule, workspaceId);
    const ctx = agentsCtx(testingModule, workspaceId);

    const first = await createAgent.execute(ctx, { name: TEST_AGENT_NAME });
    const second = await createAgent.execute(ctx, { name: TEST_AGENT_NAME });
    const third = await createAgent.execute(ctx, { name: TEST_AGENT_NAME });
    const otherWorkspaceId = ids.generate();
    await ensureWorkspaceRow(testingModule, otherWorkspaceId);
    const elsewhere = await createAgent.execute(agentsCtx(testingModule, otherWorkspaceId), {
      name: TEST_AGENT_NAME,
    });

    expect([first.name, second.name, third.name]).toEqual([
      TEST_AGENT_NAME,
      `${TEST_AGENT_NAME} 2`,
      `${TEST_AGENT_NAME} 3`,
    ]);
    expect(elsewhere.name).toBe(TEST_AGENT_NAME);
  });

  it('gives agents created at the same time different names', async () => {
    const workspaceId = ids.generate();
    await ensureWorkspaceRow(testingModule, workspaceId);
    const ctx = agentsCtx(testingModule, workspaceId);

    const views = await Promise.all(
      Array.from({ length: CONCURRENT_CREATES }, () =>
        createAgent.execute(ctx, { name: TEST_AGENT_NAME }),
      ),
    );

    expect(new Set(views.map((view) => view.name)).size).toBe(views.length);
  });

  it.each(['', '   '])('rejects the name %j', async (name) => {
    const attempt = createAgent.execute(agentsCtx(testingModule, ids.generate()), { name });

    await expect(attempt).rejects.toBeInstanceOf(InvalidAgentInputError);
  });

  it('refuses an operator', async () => {
    const attempt = createAgent.execute(
      agentsCtx(testingModule, ids.generate(), WorkspaceRole.Operator),
      { name: TEST_AGENT_NAME },
    );

    await expect(attempt).rejects.toBeInstanceOf(PermissionDeniedError);
  });
});
