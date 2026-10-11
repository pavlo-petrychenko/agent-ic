import { WorkspaceRole } from '@agent-ic/contracts';
import type { TestingModule } from '@nestjs/testing';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { ListAgentsUseCase } from '@/modules/agents/use-cases/list-agents.use-case';
import { PermissionDeniedError } from '@/platform/context/errors/permission-denied.error';
import { IdService } from '@/platform/ids/services/id.service';
import { TEST_AGENT_PAGE_LIMIT } from '@test/support/constants/agents-testing.constants';
import {
  agentsCtx,
  createAgentsTestingModule,
  publicAgentId,
  seedAgentWithDraft,
} from '@test/support/helpers/agents-testing.helpers';

describe('ListAgentsUseCase', () => {
  let testingModule: TestingModule;
  let listAgents: ListAgentsUseCase;
  let ids: IdService;

  beforeAll(async () => {
    testingModule = await createAgentsTestingModule();
    listAgents = testingModule.get(ListAgentsUseCase);
    ids = testingModule.get(IdService);
  });

  afterAll(async () => {
    await testingModule.close();
  });

  it('pages through every agent of the workspace', async () => {
    const workspaceId = ids.generate();
    const seeded = [
      await seedAgentWithDraft(testingModule, workspaceId),
      await seedAgentWithDraft(testingModule, workspaceId),
      await seedAgentWithDraft(testingModule, workspaceId),
    ];
    const ctx = agentsCtx(testingModule, workspaceId, WorkspaceRole.Builder);

    const first = await listAgents.execute(ctx, { first: TEST_AGENT_PAGE_LIMIT });
    const second = await listAgents.execute(ctx, {
      first: TEST_AGENT_PAGE_LIMIT,
      after: first.pageInfo.endCursor,
    });

    const listed = [...first.edges, ...second.edges].map((edge) => edge.node.id);
    expect(first.pageInfo.hasNextPage).toBe(true);
    expect(second.pageInfo.hasNextPage).toBe(false);
    expect(listed).toEqual(seeded.map((agent) => publicAgentId(testingModule, agent.agentId)));
  });

  it('never shows workspace B the agents of workspace A', async () => {
    await seedAgentWithDraft(testingModule, ids.generate());

    const seenByB = await listAgents.execute(agentsCtx(testingModule, ids.generate()), {});

    expect(seenByB.edges).toEqual([]);
    expect(seenByB.pageInfo.hasNextPage).toBe(false);
  });

  it('refuses an operator', async () => {
    const attempt = listAgents.execute(
      agentsCtx(testingModule, ids.generate(), WorkspaceRole.Operator),
      {},
    );

    await expect(attempt).rejects.toBeInstanceOf(PermissionDeniedError);
  });
});
