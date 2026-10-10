import { WorkspaceRole } from '@agent-ic/contracts';
import { FlowIssueCode, hasBlockingIssues } from '@agent-ic/flow';
import type { TestingModule } from '@nestjs/testing';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AgentVersionKind } from '@/modules/agents/constants/agent.constants';
import { InvalidAgentInputError } from '@/modules/agents/errors/invalid-agent-input.error';
import { SaveAgentDraftUseCase } from '@/modules/agents/use-cases/save-agent-draft.use-case';
import { PermissionDeniedError } from '@/platform/context/errors/permission-denied.error';
import { IdService } from '@/platform/ids/services/id.service';
import {
  TEST_NODE_NEW_LABEL,
  TEST_UNSUPPORTED_FLOW,
  TEST_VERSION_NOTE,
} from '@test/support/constants/agents-testing.constants';
import { emptyFlow, triggerFlow } from '@test/support/fixtures/agents.fixture';
import {
  agentsCtx,
  createAgentsTestingModule,
  publicAgentId,
  readVersions,
  seedAgentWithDraft,
} from '@test/support/helpers/agents-testing.helpers';

describe('SaveAgentDraftUseCase', () => {
  let testingModule: TestingModule;
  let saveDraft: SaveAgentDraftUseCase;
  let ids: IdService;

  beforeAll(async () => {
    testingModule = await createAgentsTestingModule();
    saveDraft = testingModule.get(SaveAgentDraftUseCase);
    ids = testingModule.get(IdService);
  });

  afterAll(async () => {
    await testingModule.close();
  });

  it('stores the flow and note in the draft', async () => {
    const workspaceId = ids.generate();
    const { agentId, draftId } = await seedAgentWithDraft(testingModule, workspaceId);

    const saved = await saveDraft.execute(agentsCtx(testingModule, workspaceId), {
      id: publicAgentId(testingModule, agentId),
      flow: triggerFlow(TEST_NODE_NEW_LABEL),
      note: TEST_VERSION_NOTE,
    });

    const [draft] = await readVersions(testingModule, workspaceId, agentId);
    expect(saved.version).toMatchObject({ kind: AgentVersionKind.Draft, note: TEST_VERSION_NOTE });
    expect(hasBlockingIssues(saved.issues)).toBe(false);
    expect(draft).toMatchObject({
      id: draftId,
      flow: triggerFlow(TEST_NODE_NEW_LABEL),
      note: TEST_VERSION_NOTE,
    });
  });

  it('saves a flow with blocking issues and returns them instead of throwing', async () => {
    const workspaceId = ids.generate();
    const { agentId, draftId } = await seedAgentWithDraft(testingModule, workspaceId);

    const saved = await saveDraft.execute(agentsCtx(testingModule, workspaceId), {
      id: publicAgentId(testingModule, agentId),
      flow: emptyFlow(),
    });

    const [draft] = await readVersions(testingModule, workspaceId, agentId);
    expect(saved.issues.map((issue) => issue.code)).toContain(FlowIssueCode.NoTrigger);
    expect(draft).toMatchObject({ id: draftId, flow: emptyFlow(), note: null });
  });

  it('rejects a document that is not a flow', async () => {
    const workspaceId = ids.generate();
    const { agentId } = await seedAgentWithDraft(testingModule, workspaceId);

    const attempt = saveDraft.execute(agentsCtx(testingModule, workspaceId), {
      id: publicAgentId(testingModule, agentId),
      flow: TEST_UNSUPPORTED_FLOW,
    });

    await expect(attempt).rejects.toBeInstanceOf(InvalidAgentInputError);
  });

  it('refuses an operator', async () => {
    const workspaceId = ids.generate();
    const { agentId } = await seedAgentWithDraft(testingModule, workspaceId);

    const attempt = saveDraft.execute(
      agentsCtx(testingModule, workspaceId, WorkspaceRole.Operator),
      { id: publicAgentId(testingModule, agentId), flow: triggerFlow() },
    );

    await expect(attempt).rejects.toBeInstanceOf(PermissionDeniedError);
  });
});
