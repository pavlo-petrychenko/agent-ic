import { WorkspaceRole } from '@agent-ic/contracts';
import { FlowIssueCode, FlowIssueSeverity } from '@agent-ic/flow';
import type { TestingModule } from '@nestjs/testing';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { SimulatorCheckStatus } from '@/modules/agents/constants/agent.constants';
import { AgentNotFoundError } from '@/modules/agents/errors/agent-not-found.error';
import { AgentPublishingService } from '@/modules/agents/services/agent-publishing.service';
import { PreviewAgentPublishUseCase } from '@/modules/agents/use-cases/preview-agent-publish.use-case';
import { PermissionDeniedError } from '@/platform/context/errors/permission-denied.error';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { IdService } from '@/platform/ids/services/id.service';
import { TEST_NODE_ID } from '@test/support/constants/agents-testing.constants';
import { triggerFlow } from '@test/support/fixtures/agents.fixture';
import {
  agentsCtx,
  createAgentsTestingModule,
  publicAgentId,
  seedAgentWithDraft,
} from '@test/support/helpers/agents-testing.helpers';

describe('PreviewAgentPublishUseCase', () => {
  let testingModule: TestingModule;
  let previewPublish: PreviewAgentPublishUseCase;
  let ids: IdService;

  beforeAll(async () => {
    testingModule = await createAgentsTestingModule();
    previewPublish = testingModule.get(PreviewAgentPublishUseCase);
    ids = testingModule.get(IdService);
  });

  afterAll(async () => {
    await testingModule.close();
  });

  it('lists the blocking errors and the warnings, each with its node', async () => {
    const workspaceId = ids.generate();
    const flow = triggerFlow();
    const [trigger] = flow.nodes;
    const { agentId } = await seedAgentWithDraft(testingModule, workspaceId, {
      ...flow,
      nodes: trigger === undefined ? [] : [trigger],
      edges: [],
    });

    const preview = await previewPublish.execute(
      agentsCtx(testingModule, workspaceId, WorkspaceRole.Builder),
      { agentId: publicAgentId(testingModule, agentId) },
    );

    expect(preview.errors).toContainEqual(
      expect.objectContaining({
        code: FlowIssueCode.NoReplyStep,
        severity: FlowIssueSeverity.Error,
        nodeId: TEST_NODE_ID,
      }),
    );
    expect(preview.warnings).toContainEqual(
      expect.objectContaining({ severity: FlowIssueSeverity.Warning, nodeId: TEST_NODE_ID }),
    );
    expect(preview.simulator).toEqual({ status: SimulatorCheckStatus.NotTested, testedAt: null });
  });

  it('compares the draft with the live version, or with nothing before the first publish', async () => {
    const workspaceId = ids.generate();
    const { agentId } = await seedAgentWithDraft(testingModule, workspaceId);
    const ctx = agentsCtx(testingModule, workspaceId);
    const input = { agentId: publicAgentId(testingModule, agentId) };

    const neverPublished = await previewPublish.execute(ctx, input);
    await testingModule
      .get(TenantTransactionService)
      .run(workspaceId, () =>
        testingModule
          .get(AgentPublishingService)
          .publish(workspaceId, agentId, { authorId: ids.generate() }),
      );
    const published = await previewPublish.execute(ctx, input);

    expect(neverPublished.diff.addedNodes).toEqual(triggerFlow().nodes);
    expect(neverPublished.errors).toEqual([]);
    expect(published.diff.addedNodes).toEqual([]);
    expect(published.diff.changedNodes).toEqual([]);
  });

  it('does not find an agent of another workspace', async () => {
    const { agentId } = await seedAgentWithDraft(testingModule, ids.generate());

    const attempt = previewPublish.execute(agentsCtx(testingModule, ids.generate()), {
      agentId: publicAgentId(testingModule, agentId),
    });

    await expect(attempt).rejects.toBeInstanceOf(AgentNotFoundError);
  });

  it('refuses an operator', async () => {
    const workspaceId = ids.generate();
    const { agentId } = await seedAgentWithDraft(testingModule, workspaceId);

    const attempt = previewPublish.execute(
      agentsCtx(testingModule, workspaceId, WorkspaceRole.Operator),
      { agentId: publicAgentId(testingModule, agentId) },
    );

    await expect(attempt).rejects.toBeInstanceOf(PermissionDeniedError);
  });
});
