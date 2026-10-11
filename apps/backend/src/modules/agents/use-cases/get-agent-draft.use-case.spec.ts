import { WorkspaceRole } from '@agent-ic/contracts';
import { FlowIssueCode } from '@agent-ic/flow';
import type { TestingModule } from '@nestjs/testing';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  AgentVersionStatus,
  DRAFT_INITIAL_REVISION,
} from '@/modules/agents/constants/agent.constants';
import { AgentNotFoundError } from '@/modules/agents/errors/agent-not-found.error';
import { GetAgentDraftUseCase } from '@/modules/agents/use-cases/get-agent-draft.use-case';
import { SaveAgentDraftUseCase } from '@/modules/agents/use-cases/save-agent-draft.use-case';
import { PermissionDeniedError } from '@/platform/context/errors/permission-denied.error';
import { IdService } from '@/platform/ids/services/id.service';
import { TEST_AUTHOR_NAME } from '@test/support/constants/agents-testing.constants';
import { emptyFlow, triggerFlow } from '@test/support/fixtures/agents.fixture';
import { workspaceCtx } from '@test/support/fixtures/workspace.fixture';
import {
  agentsCtx,
  createAgentsTestingModule,
  publicAgentId,
  seedAgentWithDraft,
  seedAuthor,
} from '@test/support/helpers/agents-testing.helpers';

describe('GetAgentDraftUseCase', () => {
  let testingModule: TestingModule;
  let getDraft: GetAgentDraftUseCase;
  let saveDraft: SaveAgentDraftUseCase;
  let ids: IdService;

  beforeAll(async () => {
    testingModule = await createAgentsTestingModule();
    getDraft = testingModule.get(GetAgentDraftUseCase);
    saveDraft = testingModule.get(SaveAgentDraftUseCase);
    ids = testingModule.get(IdService);
  });

  afterAll(async () => {
    await testingModule.close();
  });

  it('returns the draft with its revision, its issues and who saved it last', async () => {
    const workspaceId = ids.generate();
    const { agentId } = await seedAgentWithDraft(testingModule, workspaceId);
    const authorId = await seedAuthor(testingModule);
    const agentIdPublic = publicAgentId(testingModule, agentId);
    const ctx = workspaceCtx(authorId, workspaceId, WorkspaceRole.Builder);
    const fresh = await getDraft.execute(ctx, { agentId: agentIdPublic });
    const saved = await saveDraft.execute(ctx, {
      id: agentIdPublic,
      flow: emptyFlow(),
      revision: fresh.revision,
    });

    const draft = await getDraft.execute(ctx, { agentId: agentIdPublic });

    expect(fresh).toMatchObject({ revision: DRAFT_INITIAL_REVISION, issues: [] });
    expect(fresh.version.flow).toEqual(triggerFlow());
    expect(draft).toMatchObject({
      revision: DRAFT_INITIAL_REVISION + 1,
      savedAt: saved.savedAt,
      version: { status: AgentVersionStatus.Draft, author: { name: TEST_AUTHOR_NAME } },
    });
    expect(draft.issues.map((issue) => issue.code)).toContain(FlowIssueCode.NoTrigger);
  });

  it('does not find an agent of another workspace', async () => {
    const { agentId } = await seedAgentWithDraft(testingModule, ids.generate());

    const attempt = getDraft.execute(agentsCtx(testingModule, ids.generate()), {
      agentId: publicAgentId(testingModule, agentId),
    });

    await expect(attempt).rejects.toBeInstanceOf(AgentNotFoundError);
  });

  it('refuses an operator', async () => {
    const workspaceId = ids.generate();
    const { agentId } = await seedAgentWithDraft(testingModule, workspaceId);

    const attempt = getDraft.execute(
      agentsCtx(testingModule, workspaceId, WorkspaceRole.Operator),
      { agentId: publicAgentId(testingModule, agentId) },
    );

    await expect(attempt).rejects.toBeInstanceOf(PermissionDeniedError);
  });
});
