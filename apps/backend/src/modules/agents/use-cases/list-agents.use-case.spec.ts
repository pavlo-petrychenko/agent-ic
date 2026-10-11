import { WorkspaceRole } from '@agent-ic/contracts';
import type { TestingModule } from '@nestjs/testing';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { DRAFT_INITIAL_REVISION } from '@/modules/agents/constants/agent.constants';
import { AgentVersionsRepository } from '@/modules/agents/repositories/agent-versions.repository';
import { AgentPublishingService } from '@/modules/agents/services/agent-publishing.service';
import { ListAgentsUseCase } from '@/modules/agents/use-cases/list-agents.use-case';
import { PermissionDeniedError } from '@/platform/context/errors/permission-denied.error';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { IdService } from '@/platform/ids/services/id.service';
import {
  AGENTS_TEST_LATER,
  TEST_AGENT_PAGE_LIMIT,
  TEST_EDITOR_ID,
  TEST_NODE_NEW_LABEL,
} from '@test/support/constants/agents-testing.constants';
import { triggerFlow } from '@test/support/fixtures/agents.fixture';
import {
  agentsCtx,
  createAgentsTestingModule,
  publicAgentId,
  seedAgentWithDraft,
} from '@test/support/helpers/agents-testing.helpers';

const FIRST_DRAFT_NUMBER = 1;
const PUBLISH_COUNT = 2;

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

  it('reports the version fields of each agent on the page', async () => {
    const workspaceId = ids.generate();
    const neverPublished = await seedAgentWithDraft(testingModule, workspaceId);
    const edited = await seedAgentWithDraft(testingModule, workspaceId);
    await testingModule.get(TenantTransactionService).run(workspaceId, async () => {
      const publishing = testingModule.get(AgentPublishingService);
      await publishing.publish(workspaceId, edited.agentId, { authorId: ids.generate() });
      await publishing.publish(workspaceId, edited.agentId, { authorId: ids.generate() });
      await testingModule
        .get(AgentVersionsRepository)
        .updateDraft(
          workspaceId,
          edited.draftId,
          DRAFT_INITIAL_REVISION,
          { flow: triggerFlow(TEST_NODE_NEW_LABEL), note: null, authorId: TEST_EDITOR_ID },
          AGENTS_TEST_LATER,
        );
    });

    const listed = await listAgents.execute(agentsCtx(testingModule, workspaceId), {});

    const nodeOf = (agentId: string) =>
      listed.edges.find((edge) => edge.node.id === publicAgentId(testingModule, agentId))?.node;
    expect(nodeOf(neverPublished.agentId)).toMatchObject({
      liveVersionNumber: null,
      draftNumber: FIRST_DRAFT_NUMBER,
      versionCount: 0,
      hasUnpublishedChanges: true,
    });
    expect(nodeOf(edited.agentId)).toMatchObject({
      liveVersionNumber: PUBLISH_COUNT,
      draftNumber: PUBLISH_COUNT + 1,
      versionCount: PUBLISH_COUNT,
      hasUnpublishedChanges: true,
    });
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
