import { WorkspaceRole } from '@agent-ic/contracts';
import type { TestingModule } from '@nestjs/testing';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import {
  AgentStatus,
  AgentVersionKind,
  AgentVersionStatus,
} from '@/modules/agents/constants/agent.constants';
import { AgentFlowHasBlockingIssuesError } from '@/modules/agents/errors/agent-flow-has-blocking-issues.error';
import { AgentVersionsRepository } from '@/modules/agents/repositories/agent-versions.repository';
import { AgentsRepository } from '@/modules/agents/repositories/agents.repository';
import { PublishAgentUseCase } from '@/modules/agents/use-cases/publish-agent.use-case';
import { PermissionDeniedError } from '@/platform/context/errors/permission-denied.error';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { IdService } from '@/platform/ids/services/id.service';
import {
  AGENTS_TEST_LATER,
  TEST_AUTHOR_NAME,
  TEST_RELEASE_NOTE,
  TEST_ROLLBACK_MESSAGE,
  TEST_VERSION_NOTE,
} from '@test/support/constants/agents-testing.constants';
import { emptyFlow, triggerFlow } from '@test/support/fixtures/agents.fixture';
import { workspaceCtx } from '@test/support/fixtures/workspace.fixture';
import {
  agentsCtx,
  createAgentsTestingModule,
  publicAgentId,
  readAgent,
  readVersions,
  seedAgentWithDraft,
  seedAuthor,
} from '@test/support/helpers/agents-testing.helpers';

const FIRST_NUMBER = 1;

describe('PublishAgentUseCase', () => {
  let testingModule: TestingModule;
  let publishAgent: PublishAgentUseCase;
  let ids: IdService;

  beforeAll(async () => {
    testingModule = await createAgentsTestingModule();
    publishAgent = testingModule.get(PublishAgentUseCase);
    ids = testingModule.get(IdService);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  afterAll(async () => {
    await testingModule.close();
  });

  it('lets a builder publish the draft and makes the agent live', async () => {
    const workspaceId = ids.generate();
    const { agentId } = await seedAgentWithDraft(testingModule, workspaceId);
    const id = publicAgentId(testingModule, agentId);

    const published = await publishAgent.execute(
      agentsCtx(testingModule, workspaceId, WorkspaceRole.Builder),
      { id },
    );

    const agent = await readAgent(testingModule, workspaceId, agentId);
    expect(published.agent).toMatchObject({ id, status: AgentStatus.Live });
    expect(published.version).toMatchObject({
      kind: AgentVersionKind.Published,
      number: FIRST_NUMBER,
    });
    expect(agent?.liveVersionId).not.toBeNull();
  });

  it('stores the release note and returns the author and status', async () => {
    const workspaceId = ids.generate();
    const authorId = await seedAuthor(testingModule);
    const { agentId } = await seedAgentWithDraft(testingModule, workspaceId);

    const published = await publishAgent.execute(
      workspaceCtx(authorId, workspaceId, WorkspaceRole.Builder),
      { id: publicAgentId(testingModule, agentId), note: TEST_RELEASE_NOTE },
    );

    expect(published.version).toMatchObject({
      note: TEST_RELEASE_NOTE,
      status: AgentVersionStatus.Live,
      author: { name: TEST_AUTHOR_NAME },
    });
    expect(published.agent).toMatchObject({
      liveVersionNumber: FIRST_NUMBER,
      draftBaseVersionNumber: FIRST_NUMBER,
      hasUnpublishedChanges: false,
    });
  });

  it('keeps the draft note when no note is given', async () => {
    const workspaceId = ids.generate();
    const { agentId, draftId } = await seedAgentWithDraft(testingModule, workspaceId);
    await testingModule
      .get(TenantTransactionService)
      .run(workspaceId, () =>
        testingModule
          .get(AgentVersionsRepository)
          .updateDraft(
            workspaceId,
            draftId,
            { flow: triggerFlow(), note: TEST_VERSION_NOTE },
            AGENTS_TEST_LATER,
          ),
      );

    const published = await publishAgent.execute(agentsCtx(testingModule, workspaceId), {
      id: publicAgentId(testingModule, agentId),
    });

    expect(published.version).toMatchObject({ note: TEST_VERSION_NOTE, author: null });
  });

  it('stops on a blocking issue and writes nothing', async () => {
    const workspaceId = ids.generate();
    const { agentId } = await seedAgentWithDraft(testingModule, workspaceId, emptyFlow());

    const attempt = publishAgent.execute(agentsCtx(testingModule, workspaceId), {
      id: publicAgentId(testingModule, agentId),
    });

    await expect(attempt).rejects.toBeInstanceOf(AgentFlowHasBlockingIssuesError);
    const versions = await readVersions(testingModule, workspaceId, agentId);
    expect(versions.map((version) => version.kind)).toEqual([AgentVersionKind.Draft]);
  });

  it('rolls the new version back when the agent cannot be switched live', async () => {
    const workspaceId = ids.generate();
    const { agentId } = await seedAgentWithDraft(testingModule, workspaceId);
    vi.spyOn(testingModule.get(AgentsRepository), 'setLiveVersion').mockRejectedValue(
      new Error(TEST_ROLLBACK_MESSAGE),
    );

    const attempt = publishAgent.execute(agentsCtx(testingModule, workspaceId), {
      id: publicAgentId(testingModule, agentId),
    });

    await expect(attempt).rejects.toThrow(TEST_ROLLBACK_MESSAGE);
    const versions = await readVersions(testingModule, workspaceId, agentId);
    expect(versions.map((version) => version.kind)).toEqual([AgentVersionKind.Draft]);
  });

  it('refuses an operator', async () => {
    const workspaceId = ids.generate();
    const { agentId } = await seedAgentWithDraft(testingModule, workspaceId);

    const attempt = publishAgent.execute(
      agentsCtx(testingModule, workspaceId, WorkspaceRole.Operator),
      { id: publicAgentId(testingModule, agentId) },
    );

    await expect(attempt).rejects.toBeInstanceOf(PermissionDeniedError);
  });
});
