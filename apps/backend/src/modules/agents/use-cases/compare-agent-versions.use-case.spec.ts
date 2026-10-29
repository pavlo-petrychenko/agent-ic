import { IdPrefix, WorkspaceRole } from '@agent-ic/contracts';
import { MIN_AUTO_CLOSE_MINUTES, type FlowDocument } from '@agent-ic/flow';
import type { TestingModule } from '@nestjs/testing';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { DRAFT_INITIAL_REVISION } from '@/modules/agents/constants/agent.constants';
import { AgentNotFoundError } from '@/modules/agents/errors/agent-not-found.error';
import { AgentVersionNotFoundError } from '@/modules/agents/errors/agent-version-not-found.error';
import { AgentVersionsRepository } from '@/modules/agents/repositories/agent-versions.repository';
import { AgentPublishingService } from '@/modules/agents/services/agent-publishing.service';
import { CompareAgentVersionsUseCase } from '@/modules/agents/use-cases/compare-agent-versions.use-case';
import { PermissionDeniedError } from '@/platform/context/errors/permission-denied.error';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { IdService } from '@/platform/ids/services/id.service';
import {
  TEST_EDITOR_ID,
  TEST_NODE_ID,
  TEST_NODE_LABEL,
  TEST_NODE_NEW_LABEL,
} from '@test/support/constants/agents-testing.constants';
import { triggerFlow } from '@test/support/fixtures/agents.fixture';
import {
  agentsCtx,
  createAgentsTestingModule,
  deleteAgent,
  publicAgentId,
  seedAgentWithDraft,
} from '@test/support/helpers/agents-testing.helpers';
import type { SeededAgent } from '@test/support/typedefs/agents-testing.typedefs';

describe('CompareAgentVersionsUseCase', () => {
  let testingModule: TestingModule;
  let compareVersions: CompareAgentVersionsUseCase;
  let ids: IdService;

  const publishThenEdit = async (
    workspaceId: string,
    seeded: SeededAgent,
    flow: FlowDocument = triggerFlow(TEST_NODE_NEW_LABEL),
  ): Promise<string> =>
    testingModule.get(TenantTransactionService).run(workspaceId, async () => {
      const published = await testingModule
        .get(AgentPublishingService)
        .publish(workspaceId, seeded.agentId, { authorId: TEST_EDITOR_ID });
      await testingModule
        .get(AgentVersionsRepository)
        .updateDraft(workspaceId, seeded.draftId, DRAFT_INITIAL_REVISION, {
          flow,
          note: null,
          authorId: TEST_EDITOR_ID,
        });
      return ids.toPublic(IdPrefix.AgentVersion, published.id);
    });

  beforeAll(async () => {
    testingModule = await createAgentsTestingModule();
    compareVersions = testingModule.get(CompareAgentVersionsUseCase);
    ids = testingModule.get(IdService);
  });

  afterAll(async () => {
    await testingModule.close();
  });

  it('lists what changed from a published version to the draft', async () => {
    const workspaceId = ids.generate();
    const seeded = await seedAgentWithDraft(testingModule, workspaceId);
    const fromId = await publishThenEdit(workspaceId, seeded);

    const diff = await compareVersions.execute(
      agentsCtx(testingModule, workspaceId, WorkspaceRole.Builder),
      {
        agentId: publicAgentId(testingModule, seeded.agentId),
        fromId,
        toId: ids.toPublic(IdPrefix.AgentVersion, seeded.draftId),
      },
    );

    expect(diff.changedNodes).toEqual([
      expect.objectContaining({
        nodeId: TEST_NODE_ID,
        fields: [{ path: ['label'], before: TEST_NODE_LABEL, after: TEST_NODE_NEW_LABEL }],
      }),
    ]);
    expect(diff.addedNodes).toEqual([]);
  });

  it('lists the flow settings that changed', async () => {
    const workspaceId = ids.generate();
    const seeded = await seedAgentWithDraft(testingModule, workspaceId);
    const flow = triggerFlow();
    const autoClose = { afterMinutes: MIN_AUTO_CLOSE_MINUTES };
    const fromId = await publishThenEdit(workspaceId, seeded, {
      ...flow,
      settings: { ...flow.settings, autoClose },
    });

    const diff = await compareVersions.execute(agentsCtx(testingModule, workspaceId), {
      agentId: publicAgentId(testingModule, seeded.agentId),
      fromId,
      toId: ids.toPublic(IdPrefix.AgentVersion, seeded.draftId),
    });

    expect(diff.settingsChanges).toEqual([{ path: ['autoClose'], before: null, after: autoClose }]);
    expect(diff.changedNodes).toEqual([]);
  });

  it('does not find a version of another agent', async () => {
    const workspaceId = ids.generate();
    const seeded = await seedAgentWithDraft(testingModule, workspaceId);
    const other = await seedAgentWithDraft(testingModule, workspaceId);

    const attempt = compareVersions.execute(agentsCtx(testingModule, workspaceId), {
      agentId: publicAgentId(testingModule, seeded.agentId),
      fromId: ids.toPublic(IdPrefix.AgentVersion, other.draftId),
      toId: ids.toPublic(IdPrefix.AgentVersion, seeded.draftId),
    });

    await expect(attempt).rejects.toBeInstanceOf(AgentVersionNotFoundError);
  });

  it('does not find an agent of another workspace', async () => {
    const workspaceId = ids.generate();
    const seeded = await seedAgentWithDraft(testingModule, workspaceId);
    const draftId = ids.toPublic(IdPrefix.AgentVersion, seeded.draftId);

    const attempt = compareVersions.execute(agentsCtx(testingModule, ids.generate()), {
      agentId: publicAgentId(testingModule, seeded.agentId),
      fromId: draftId,
      toId: draftId,
    });

    await expect(attempt).rejects.toBeInstanceOf(AgentNotFoundError);
  });

  it('does not find a deleted agent', async () => {
    const workspaceId = ids.generate();
    const seeded = await seedAgentWithDraft(testingModule, workspaceId);
    const draftId = ids.toPublic(IdPrefix.AgentVersion, seeded.draftId);
    await deleteAgent(testingModule, workspaceId, seeded.agentId);

    const attempt = compareVersions.execute(agentsCtx(testingModule, workspaceId), {
      agentId: publicAgentId(testingModule, seeded.agentId),
      fromId: draftId,
      toId: draftId,
    });

    await expect(attempt).rejects.toBeInstanceOf(AgentNotFoundError);
  });

  it('refuses an operator', async () => {
    const workspaceId = ids.generate();
    const seeded = await seedAgentWithDraft(testingModule, workspaceId);
    const draftId = ids.toPublic(IdPrefix.AgentVersion, seeded.draftId);

    const attempt = compareVersions.execute(
      agentsCtx(testingModule, workspaceId, WorkspaceRole.Operator),
      { agentId: publicAgentId(testingModule, seeded.agentId), fromId: draftId, toId: draftId },
    );

    await expect(attempt).rejects.toBeInstanceOf(PermissionDeniedError);
  });
});
