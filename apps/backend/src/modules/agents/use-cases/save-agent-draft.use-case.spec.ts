import { ErrorCode, ErrorReason, WorkspaceRole } from '@agent-ic/contracts';
import { FlowIssueCode, hasBlockingIssues } from '@agent-ic/flow';
import type { TestingModule } from '@nestjs/testing';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  AgentVersionKind,
  AgentVersionStatus,
  DRAFT_INITIAL_REVISION,
} from '@/modules/agents/constants/agent.constants';
import { AgentNotFoundError } from '@/modules/agents/errors/agent-not-found.error';
import { DraftConflictError } from '@/modules/agents/errors/draft-conflict.error';
import { InvalidAgentInputError } from '@/modules/agents/errors/invalid-agent-input.error';
import { SaveAgentDraftUseCase } from '@/modules/agents/use-cases/save-agent-draft.use-case';
import { PermissionDeniedError } from '@/platform/context/errors/permission-denied.error';
import { toGraphqlError } from '@/platform/errors/helpers/graphql-error.helpers';
import { IdService } from '@/platform/ids/services/id.service';
import {
  TEST_AUTHOR_NAME,
  TEST_NODE_LABEL,
  TEST_NODE_NEW_LABEL,
  TEST_UNSUPPORTED_FLOW,
  TEST_VERSION_NOTE,
} from '@test/support/constants/agents-testing.constants';
import { SAMPLE_TRACE_ID } from '@test/support/constants/sample-errors.constants';
import { emptyFlow, triggerFlow } from '@test/support/fixtures/agents.fixture';
import { workspaceCtx } from '@test/support/fixtures/workspace.fixture';
import {
  agentsCtx,
  createAgentsTestingModule,
  publicAgentId,
  readVersions,
  seedAgentWithDraft,
  seedAuthor,
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
      revision: DRAFT_INITIAL_REVISION,
      note: TEST_VERSION_NOTE,
    });

    const [draft] = await readVersions(testingModule, workspaceId, agentId);
    expect(saved.version).toMatchObject({
      kind: AgentVersionKind.Draft,
      status: AgentVersionStatus.Draft,
      note: TEST_VERSION_NOTE,
    });
    expect(saved.revision).toBe(DRAFT_INITIAL_REVISION + 1);
    expect(hasBlockingIssues(saved.issues)).toBe(false);
    expect(draft).toMatchObject({
      id: draftId,
      revision: DRAFT_INITIAL_REVISION + 1,
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
      revision: DRAFT_INITIAL_REVISION,
    });

    const [draft] = await readVersions(testingModule, workspaceId, agentId);
    expect(saved.issues.map((issue) => issue.code)).toContain(FlowIssueCode.NoTrigger);
    expect(draft).toMatchObject({ id: draftId, flow: emptyFlow(), note: null });
  });

  it('keeps the note when the client leaves it out and clears it on an explicit null', async () => {
    const workspaceId = ids.generate();
    const { agentId } = await seedAgentWithDraft(testingModule, workspaceId);
    const ctx = agentsCtx(testingModule, workspaceId);
    const id = publicAgentId(testingModule, agentId);
    const first = await saveDraft.execute(ctx, {
      id,
      flow: triggerFlow(),
      revision: DRAFT_INITIAL_REVISION,
      note: TEST_VERSION_NOTE,
    });

    const autosaved = await saveDraft.execute(ctx, {
      id,
      flow: triggerFlow(TEST_NODE_NEW_LABEL),
      revision: first.revision,
    });
    const [kept] = await readVersions(testingModule, workspaceId, agentId);
    const cleared = await saveDraft.execute(ctx, {
      id,
      flow: triggerFlow(),
      revision: autosaved.revision,
      note: null,
    });
    const [removed] = await readVersions(testingModule, workspaceId, agentId);

    expect(autosaved.version.note).toBe(TEST_VERSION_NOTE);
    expect(kept).toMatchObject({ note: TEST_VERSION_NOTE });
    expect(cleared.version.note).toBeNull();
    expect(removed).toMatchObject({ note: null });
  });

  it('refuses a stale revision with who saved the draft and when, and writes nothing', async () => {
    const workspaceId = ids.generate();
    const { agentId } = await seedAgentWithDraft(testingModule, workspaceId);
    const authorId = await seedAuthor(testingModule);
    const id = publicAgentId(testingModule, agentId);
    const first = await saveDraft.execute(
      workspaceCtx(authorId, workspaceId, WorkspaceRole.Builder),
      {
        id,
        flow: triggerFlow(TEST_NODE_NEW_LABEL),
        revision: DRAFT_INITIAL_REVISION,
      },
    );

    const attempt = saveDraft.execute(agentsCtx(testingModule, workspaceId), {
      id,
      flow: emptyFlow(),
      revision: DRAFT_INITIAL_REVISION,
    });

    const error = await attempt.catch((caught: unknown) => caught);
    const [draft] = await readVersions(testingModule, workspaceId, agentId);
    expect(error).toBeInstanceOf(DraftConflictError);
    expect(toGraphqlError(error, SAMPLE_TRACE_ID).extensions).toMatchObject({
      code: ErrorCode.Conflict,
      reason: ErrorReason.DraftConflict,
      details: { savedBy: TEST_AUTHOR_NAME, savedAt: first.savedAt.toISOString() },
    });
    expect(draft).toMatchObject({
      flow: triggerFlow(TEST_NODE_NEW_LABEL),
      revision: first.revision,
    });
  });

  it('lets exactly one of two saves from the same revision win', async () => {
    const workspaceId = ids.generate();
    const { agentId } = await seedAgentWithDraft(testingModule, workspaceId);
    const ctx = agentsCtx(testingModule, workspaceId);
    const id = publicAgentId(testingModule, agentId);
    const save = (label: string) =>
      saveDraft.execute(ctx, { id, flow: triggerFlow(label), revision: DRAFT_INITIAL_REVISION });

    const results = await Promise.all(
      [save(TEST_NODE_NEW_LABEL), save(TEST_NODE_LABEL)].map((saving) =>
        saving.catch((caught: unknown) => caught),
      ),
    );

    const [draft] = await readVersions(testingModule, workspaceId, agentId);
    const lost = results.filter((result) => result instanceof DraftConflictError);
    const won = results.filter((result) => !(result instanceof DraftConflictError));
    expect(lost).toHaveLength(1);
    expect(won).toHaveLength(1);
    expect(won[0]).toMatchObject({
      revision: DRAFT_INITIAL_REVISION + 1,
      version: { flow: draft?.flow },
    });
    expect(draft?.revision).toBe(DRAFT_INITIAL_REVISION + 1);
  });

  it('rejects a document that is not a flow', async () => {
    const workspaceId = ids.generate();
    const { agentId } = await seedAgentWithDraft(testingModule, workspaceId);

    const attempt = saveDraft.execute(agentsCtx(testingModule, workspaceId), {
      id: publicAgentId(testingModule, agentId),
      flow: TEST_UNSUPPORTED_FLOW,
      revision: DRAFT_INITIAL_REVISION,
    });

    await expect(attempt).rejects.toBeInstanceOf(InvalidAgentInputError);
  });

  it('does not find an agent of another workspace', async () => {
    const { agentId } = await seedAgentWithDraft(testingModule, ids.generate());

    const attempt = saveDraft.execute(agentsCtx(testingModule, ids.generate()), {
      id: publicAgentId(testingModule, agentId),
      flow: triggerFlow(),
      revision: DRAFT_INITIAL_REVISION,
    });

    await expect(attempt).rejects.toBeInstanceOf(AgentNotFoundError);
  });

  it('refuses an operator', async () => {
    const workspaceId = ids.generate();
    const { agentId } = await seedAgentWithDraft(testingModule, workspaceId);

    const attempt = saveDraft.execute(
      agentsCtx(testingModule, workspaceId, WorkspaceRole.Operator),
      {
        id: publicAgentId(testingModule, agentId),
        flow: triggerFlow(),
        revision: DRAFT_INITIAL_REVISION,
      },
    );

    await expect(attempt).rejects.toBeInstanceOf(PermissionDeniedError);
  });
});
