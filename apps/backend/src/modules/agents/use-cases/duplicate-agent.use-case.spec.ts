import { AGENT_NAME_MAX_LENGTH, IdPrefix, WorkspaceRole } from '@agent-ic/contracts';
import type { TestingModule } from '@nestjs/testing';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { DUPLICATE_AGENT_NAME_SUFFIX } from '@/modules/agents/constants/agent-input.constants';
import {
  AgentStatus,
  AgentVersionKind,
  DRAFT_INITIAL_REVISION,
} from '@/modules/agents/constants/agent.constants';
import { AgentNotFoundError } from '@/modules/agents/errors/agent-not-found.error';
import { AgentVersionsRepository } from '@/modules/agents/repositories/agent-versions.repository';
import { AgentsRepository } from '@/modules/agents/repositories/agents.repository';
import { DuplicateAgentUseCase } from '@/modules/agents/use-cases/duplicate-agent.use-case';
import { PermissionDeniedError } from '@/platform/context/errors/permission-denied.error';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { IdService } from '@/platform/ids/services/id.service';
import {
  AGENTS_TEST_LATER,
  TEST_AGENT_DESCRIPTION,
  TEST_AGENT_NAME,
  TEST_EDITOR_ID,
  TEST_NODE_NEW_LABEL,
  TEST_VERSION_NOTE,
} from '@test/support/constants/agents-testing.constants';
import { triggerFlow } from '@test/support/fixtures/agents.fixture';
import {
  agentsCtx,
  createAgentsTestingModule,
  makeAgentLive,
  publicAgentId,
  readAgent,
  readVersions,
  seedAgentWithDraft,
} from '@test/support/helpers/agents-testing.helpers';

describe('DuplicateAgentUseCase', () => {
  let testingModule: TestingModule;
  let duplicateAgent: DuplicateAgentUseCase;
  let ids: IdService;

  beforeAll(async () => {
    testingModule = await createAgentsTestingModule();
    duplicateAgent = testingModule.get(DuplicateAgentUseCase);
    ids = testingModule.get(IdService);
  });

  afterAll(async () => {
    await testingModule.close();
  });

  it('copies the draft into a new agent that is not live', async () => {
    const workspaceId = ids.generate();
    const seeded = await seedAgentWithDraft(testingModule, workspaceId);
    await makeAgentLive(testingModule, workspaceId, seeded);
    await testingModule.get(TenantTransactionService).run(workspaceId, async () => {
      await testingModule.get(AgentVersionsRepository).updateDraft(
        workspaceId,
        seeded.draftId,
        DRAFT_INITIAL_REVISION,
        {
          flow: triggerFlow(TEST_NODE_NEW_LABEL),
          note: TEST_VERSION_NOTE,
          authorId: TEST_EDITOR_ID,
        },
        AGENTS_TEST_LATER,
      );
      await testingModule
        .get(AgentsRepository)
        .setDescription(workspaceId, seeded.agentId, TEST_AGENT_DESCRIPTION, AGENTS_TEST_LATER);
    });

    const copy = await duplicateAgent.execute(agentsCtx(testingModule, workspaceId), {
      id: publicAgentId(testingModule, seeded.agentId),
    });

    const copyId = ids.fromPublic(IdPrefix.Agent, copy.id);
    const stored = await readAgent(testingModule, workspaceId, copyId);
    const versions = await readVersions(testingModule, workspaceId, copyId);
    expect(copy).toMatchObject({
      name: `${TEST_AGENT_NAME}${DUPLICATE_AGENT_NAME_SUFFIX}`,
      description: TEST_AGENT_DESCRIPTION,
      status: AgentStatus.Draft,
      versionCount: 0,
    });
    expect(stored).toMatchObject({ liveVersionId: null, draftVersionId: versions[0]?.id });
    expect(versions).toHaveLength(1);
    expect(versions[0]).toMatchObject({
      kind: AgentVersionKind.Draft,
      flow: triggerFlow(TEST_NODE_NEW_LABEL),
      note: TEST_VERSION_NOTE,
    });
  });

  it('keeps the copy name within the agent name limit', async () => {
    const workspaceId = ids.generate();
    const agentId = ids.generate();
    const draftId = ids.generate();
    const longName = 'a'.repeat(AGENT_NAME_MAX_LENGTH);
    await testingModule.get(TenantTransactionService).run(workspaceId, async () => {
      await testingModule.get(AgentsRepository).insert({
        id: agentId,
        workspaceId,
        name: longName,
        draftVersionId: draftId,
        createdAt: AGENTS_TEST_LATER,
        updatedAt: AGENTS_TEST_LATER,
      });
      await testingModule.get(AgentVersionsRepository).insert({
        id: draftId,
        workspaceId,
        agentId,
        kind: AgentVersionKind.Draft,
        flow: triggerFlow(),
        createdAt: AGENTS_TEST_LATER,
        updatedAt: AGENTS_TEST_LATER,
      });
    });

    const copy = await duplicateAgent.execute(agentsCtx(testingModule, workspaceId), {
      id: publicAgentId(testingModule, agentId),
    });

    expect(copy.name).toHaveLength(AGENT_NAME_MAX_LENGTH);
    expect(copy.name.endsWith(DUPLICATE_AGENT_NAME_SUFFIX)).toBe(true);
  });

  it('does not find an agent of another workspace', async () => {
    const { agentId } = await seedAgentWithDraft(testingModule, ids.generate());

    const attempt = duplicateAgent.execute(agentsCtx(testingModule, ids.generate()), {
      id: publicAgentId(testingModule, agentId),
    });

    await expect(attempt).rejects.toBeInstanceOf(AgentNotFoundError);
  });

  it('refuses an operator', async () => {
    const workspaceId = ids.generate();
    const { agentId } = await seedAgentWithDraft(testingModule, workspaceId);

    const attempt = duplicateAgent.execute(
      agentsCtx(testingModule, workspaceId, WorkspaceRole.Operator),
      { id: publicAgentId(testingModule, agentId) },
    );

    await expect(attempt).rejects.toBeInstanceOf(PermissionDeniedError);
  });
});
