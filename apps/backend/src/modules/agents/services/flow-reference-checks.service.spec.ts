import { WorkspaceRole } from '@agent-ic/contracts';
import { FlowIssueCode, FlowIssueSeverity } from '@agent-ic/flow';
import type { FlowIssue } from '@agent-ic/flow';
import type { TestingModule } from '@nestjs/testing';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { AgentStatus, AgentVersionKind } from '@/modules/agents/constants/agent.constants';
import { AgentFlowHasBlockingIssuesError } from '@/modules/agents/errors/agent-flow-has-blocking-issues.error';
import { PreviewAgentPublishUseCase } from '@/modules/agents/use-cases/preview-agent-publish.use-case';
import { PublishAgentUseCase } from '@/modules/agents/use-cases/publish-agent.use-case';
import { IdService } from '@/platform/ids/services/id.service';
import { Role } from '@/platform/module-roles/constants/role.constants';
import { TEST_NODE_ID } from '@test/support/constants/agents-testing.constants';
import { FakeFlowReferenceChecker } from '@test/support/fakes/flow-reference-checker.fake';
import {
  agentsCtx,
  createAgentsTestingModule,
  publicAgentId,
  readVersions,
  seedAgentWithDraft,
} from '@test/support/helpers/agents-testing.helpers';
import { FlowReferenceProbeModule } from '@test/support/modules/flow-reference-probe.module';

const referenceIssue = (severity: FlowIssueSeverity): FlowIssue => ({
  code: FlowIssueCode.MissingPrompt,
  severity,
  nodeId: TEST_NODE_ID,
  edgeId: null,
  path: [],
  params: {},
});

describe('FlowReferenceChecksService', () => {
  describe('with no checker registered', () => {
    let testingModule: TestingModule;

    beforeAll(async () => {
      testingModule = await createAgentsTestingModule();
    });

    afterAll(async () => {
      await testingModule.close();
    });

    it('publishes the draft', async () => {
      const workspaceId = testingModule.get(IdService).generate();
      const { agentId } = await seedAgentWithDraft(testingModule, workspaceId);

      const published = await testingModule
        .get(PublishAgentUseCase)
        .execute(agentsCtx(testingModule, workspaceId), {
          id: publicAgentId(testingModule, agentId),
        });

      expect(published.agent.status).toBe(AgentStatus.Live);
    });
  });

  describe('with a checker registered by another module', () => {
    let testingModule: TestingModule;
    let checker: FakeFlowReferenceChecker;

    beforeAll(async () => {
      testingModule = await createAgentsTestingModule([
        FlowReferenceProbeModule.forRole(Role.Gateway),
      ]);
      checker = testingModule.get(FakeFlowReferenceChecker);
    });

    afterEach(() => {
      checker.issues = [];
    });

    afterAll(async () => {
      await testingModule.close();
    });

    it('blocks the publish on its error and writes nothing', async () => {
      const workspaceId = testingModule.get(IdService).generate();
      const { agentId } = await seedAgentWithDraft(testingModule, workspaceId);
      checker.issues = [referenceIssue(FlowIssueSeverity.Error)];

      const attempt = testingModule
        .get(PublishAgentUseCase)
        .execute(agentsCtx(testingModule, workspaceId, WorkspaceRole.Builder), {
          id: publicAgentId(testingModule, agentId),
        });

      await expect(attempt).rejects.toBeInstanceOf(AgentFlowHasBlockingIssuesError);
      const versions = await readVersions(testingModule, workspaceId, agentId);
      expect(versions.map((version) => version.kind)).toEqual([AgentVersionKind.Draft]);
      expect(checker.checkedWorkspaces).toContain(workspaceId);
    });

    it('still publishes with its warning', async () => {
      const workspaceId = testingModule.get(IdService).generate();
      const { agentId } = await seedAgentWithDraft(testingModule, workspaceId);
      checker.issues = [referenceIssue(FlowIssueSeverity.Warning)];

      const published = await testingModule
        .get(PublishAgentUseCase)
        .execute(agentsCtx(testingModule, workspaceId), {
          id: publicAgentId(testingModule, agentId),
        });

      expect(published.agent.status).toBe(AgentStatus.Live);
    });

    it('merges its issues into the publish preview', async () => {
      const workspaceId = testingModule.get(IdService).generate();
      const { agentId } = await seedAgentWithDraft(testingModule, workspaceId);
      checker.issues = [
        referenceIssue(FlowIssueSeverity.Error),
        referenceIssue(FlowIssueSeverity.Warning),
      ];

      const preview = await testingModule
        .get(PreviewAgentPublishUseCase)
        .execute(agentsCtx(testingModule, workspaceId), {
          agentId: publicAgentId(testingModule, agentId),
        });

      expect(preview.errors).toEqual([referenceIssue(FlowIssueSeverity.Error)]);
      expect(preview.warnings).toContainEqual(referenceIssue(FlowIssueSeverity.Warning));
    });
  });
});
