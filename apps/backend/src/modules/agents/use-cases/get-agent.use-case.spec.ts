import { WorkspaceRole } from '@agent-ic/contracts';
import type { TestingModule } from '@nestjs/testing';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AgentStatus, DRAFT_INITIAL_REVISION } from '@/modules/agents/constants/agent.constants';
import { AgentNotFoundError } from '@/modules/agents/errors/agent-not-found.error';
import { AgentVersionsRepository } from '@/modules/agents/repositories/agent-versions.repository';
import { AgentPublishingService } from '@/modules/agents/services/agent-publishing.service';
import { GetAgentUseCase } from '@/modules/agents/use-cases/get-agent.use-case';
import { PermissionDeniedError } from '@/platform/context/errors/permission-denied.error';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { IdService } from '@/platform/ids/services/id.service';
import {
  AGENTS_TEST_LATER,
  TEST_AGENT_NAME,
  TEST_EDITOR_ID,
  TEST_NODE_NEW_LABEL,
} from '@test/support/constants/agents-testing.constants';
import { triggerFlow } from '@test/support/fixtures/agents.fixture';
import {
  agentsCtx,
  createAgentsTestingModule,
  makeAgentLive,
  publicAgentId,
  seedAgentWithDraft,
} from '@test/support/helpers/agents-testing.helpers';

const FIRST_DRAFT_NUMBER = 1;
const PUBLISH_COUNT = 2;

describe('GetAgentUseCase', () => {
  let testingModule: TestingModule;
  let getAgent: GetAgentUseCase;
  let ids: IdService;

  beforeAll(async () => {
    testingModule = await createAgentsTestingModule();
    getAgent = testingModule.get(GetAgentUseCase);
    ids = testingModule.get(IdService);
  });

  afterAll(async () => {
    await testingModule.close();
  });

  it('returns a draft agent and then a live one', async () => {
    const workspaceId = ids.generate();
    const seeded = await seedAgentWithDraft(testingModule, workspaceId);
    const id = publicAgentId(testingModule, seeded.agentId);
    const ctx = agentsCtx(testingModule, workspaceId, WorkspaceRole.Builder);

    const draft = await getAgent.execute(ctx, { id });
    await makeAgentLive(testingModule, workspaceId, seeded);
    const live = await getAgent.execute(ctx, { id });

    expect(draft).toMatchObject({ id, name: TEST_AGENT_NAME, status: AgentStatus.Draft });
    expect(live.status).toBe(AgentStatus.Live);
  });

  it('reports the version fields before and after publishing', async () => {
    const workspaceId = ids.generate();
    const { agentId, draftId } = await seedAgentWithDraft(testingModule, workspaceId);
    const id = publicAgentId(testingModule, agentId);
    const ctx = agentsCtx(testingModule, workspaceId);
    const tenants = testingModule.get(TenantTransactionService);

    const neverPublished = await getAgent.execute(ctx, { id });
    await tenants.run(workspaceId, async () => {
      const publishing = testingModule.get(AgentPublishingService);
      await publishing.publish(workspaceId, agentId, { authorId: ids.generate() });
      await publishing.publish(workspaceId, agentId, { authorId: ids.generate() });
    });
    const published = await getAgent.execute(ctx, { id });
    await tenants.run(workspaceId, () =>
      testingModule
        .get(AgentVersionsRepository)
        .updateDraft(
          workspaceId,
          draftId,
          DRAFT_INITIAL_REVISION,
          { flow: triggerFlow(TEST_NODE_NEW_LABEL), note: null, authorId: TEST_EDITOR_ID },
          AGENTS_TEST_LATER,
        ),
    );
    const edited = await getAgent.execute(ctx, { id });

    expect(neverPublished).toMatchObject({
      description: null,
      liveVersionNumber: null,
      draftNumber: FIRST_DRAFT_NUMBER,
      draftBaseVersionNumber: null,
      hasUnpublishedChanges: true,
      versionCount: 0,
    });
    expect(published).toMatchObject({
      liveVersionNumber: PUBLISH_COUNT,
      draftNumber: PUBLISH_COUNT + 1,
      draftBaseVersionNumber: PUBLISH_COUNT,
      hasUnpublishedChanges: false,
      versionCount: PUBLISH_COUNT,
    });
    expect(edited).toMatchObject({ liveVersionNumber: PUBLISH_COUNT, hasUnpublishedChanges: true });
  });

  it('does not find an agent of another workspace', async () => {
    const { agentId } = await seedAgentWithDraft(testingModule, ids.generate());

    const attempt = getAgent.execute(agentsCtx(testingModule, ids.generate()), {
      id: publicAgentId(testingModule, agentId),
    });

    await expect(attempt).rejects.toBeInstanceOf(AgentNotFoundError);
  });

  it('refuses an operator', async () => {
    const workspaceId = ids.generate();
    const { agentId } = await seedAgentWithDraft(testingModule, workspaceId);

    const attempt = getAgent.execute(
      agentsCtx(testingModule, workspaceId, WorkspaceRole.Operator),
      { id: publicAgentId(testingModule, agentId) },
    );

    await expect(attempt).rejects.toBeInstanceOf(PermissionDeniedError);
  });
});
