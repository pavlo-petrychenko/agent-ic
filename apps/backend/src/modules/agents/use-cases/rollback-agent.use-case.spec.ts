import {
  IdPrefix,
  PermissionAction,
  PermissionResource,
  permissionKey,
  WorkspaceRole,
} from '@agent-ic/contracts';
import type { TestingModule } from '@nestjs/testing';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  AgentVersionKind,
  AgentVersionStatus,
  DRAFT_INITIAL_REVISION,
} from '@/modules/agents/constants/agent.constants';
import { AgentFlowHasBlockingIssuesError } from '@/modules/agents/errors/agent-flow-has-blocking-issues.error';
import { AgentVersionAlreadyLiveError } from '@/modules/agents/errors/agent-version-already-live.error';
import { AgentVersionNotFoundError } from '@/modules/agents/errors/agent-version-not-found.error';
import { DraftConflictError } from '@/modules/agents/errors/draft-conflict.error';
import { AgentPublishingService } from '@/modules/agents/services/agent-publishing.service';
import { RollbackAgentUseCase } from '@/modules/agents/use-cases/rollback-agent.use-case';
import { SaveAgentDraftUseCase } from '@/modules/agents/use-cases/save-agent-draft.use-case';
import { PermissionDeniedError } from '@/platform/context/errors/permission-denied.error';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { IdService } from '@/platform/ids/services/id.service';
import {
  TEST_DEFAULT_ROLLBACK_NOTE,
  TEST_EDITOR_ID,
  TEST_NODE_NEW_LABEL,
  TEST_ROLLBACK_NOTE,
} from '@test/support/constants/agents-testing.constants';
import { emptyFlow, triggerFlow } from '@test/support/fixtures/agents.fixture';
import {
  agentsCtx,
  createAgentsTestingModule,
  publicAgentId,
  readAgent,
  readVersions,
  seedAgentWithDraft,
  seedPublishedVersion,
} from '@test/support/helpers/agents-testing.helpers';
import type { SeededAgent } from '@test/support/typedefs/agents-testing.typedefs';

const FIRST_NUMBER = 1;
const SECOND_NUMBER = 2;
const THIRD_NUMBER = 3;

interface PublishedTwice {
  readonly firstId: string;
  readonly secondId: string;
  readonly revision: number;
}

describe('RollbackAgentUseCase', () => {
  let testingModule: TestingModule;
  let rollbackAgent: RollbackAgentUseCase;
  let ids: IdService;

  const publishDraft = (workspaceId: string, seeded: SeededAgent) =>
    testingModule
      .get(TenantTransactionService)
      .run(workspaceId, () =>
        testingModule
          .get(AgentPublishingService)
          .publish(workspaceId, seeded.agentId, { authorId: TEST_EDITOR_ID }),
      );

  const publishTwice = async (
    ctx: UseCaseCtx,
    workspaceId: string,
    seeded: SeededAgent,
  ): Promise<PublishedTwice> => {
    const first = await publishDraft(workspaceId, seeded);
    const saved = await testingModule.get(SaveAgentDraftUseCase).execute(ctx, {
      id: publicAgentId(testingModule, seeded.agentId),
      flow: triggerFlow(TEST_NODE_NEW_LABEL),
      revision: DRAFT_INITIAL_REVISION,
    });
    const second = await publishDraft(workspaceId, seeded);
    return {
      firstId: ids.toPublic(IdPrefix.AgentVersion, first.id),
      secondId: ids.toPublic(IdPrefix.AgentVersion, second.id),
      revision: saved.revision,
    };
  };

  const readDraft = async (workspaceId: string, seeded: SeededAgent) =>
    (await readVersions(testingModule, workspaceId, seeded.agentId)).find(
      (version) => version.id === seeded.draftId,
    );

  beforeAll(async () => {
    testingModule = await createAgentsTestingModule();
    rollbackAgent = testingModule.get(RollbackAgentUseCase);
    ids = testingModule.get(IdService);
  });

  afterAll(async () => {
    await testingModule.close();
  });

  it('lets a builder make an old flow live as a new version', async () => {
    const workspaceId = ids.generate();
    const seeded = await seedAgentWithDraft(testingModule, workspaceId);
    const ctx = agentsCtx(testingModule, workspaceId, WorkspaceRole.Builder);
    const { firstId, revision } = await publishTwice(ctx, workspaceId, seeded);

    const rolledBack = await rollbackAgent.execute(ctx, { versionId: firstId, revision });

    const agent = await readAgent(testingModule, workspaceId, seeded.agentId);
    expect(rolledBack.version).toMatchObject({
      kind: AgentVersionKind.Published,
      number: THIRD_NUMBER,
      status: AgentVersionStatus.Live,
      flow: triggerFlow(),
      note: TEST_DEFAULT_ROLLBACK_NOTE,
    });
    expect(rolledBack.agent).toMatchObject({
      liveVersionNumber: THIRD_NUMBER,
      draftBaseVersionNumber: THIRD_NUMBER,
      hasUnpublishedChanges: false,
    });
    expect(rolledBack.draft).toMatchObject({ revision: revision + 1, changeCount: 0 });
    expect(rolledBack.draft.version.flow).toEqual(triggerFlow());
    expect(agent?.liveVersionId).toBe(ids.fromPublic(IdPrefix.AgentVersion, rolledBack.version.id));
  });

  it('stores the note it is given', async () => {
    const workspaceId = ids.generate();
    const seeded = await seedAgentWithDraft(testingModule, workspaceId);
    const ctx = agentsCtx(testingModule, workspaceId);
    const { firstId, revision } = await publishTwice(ctx, workspaceId, seeded);

    const rolledBack = await rollbackAgent.execute(ctx, {
      versionId: firstId,
      revision,
      note: TEST_ROLLBACK_NOTE,
    });

    expect(rolledBack.version.note).toBe(TEST_ROLLBACK_NOTE);
  });

  it('refuses a stale revision and leaves the draft and live version as they were', async () => {
    const workspaceId = ids.generate();
    const seeded = await seedAgentWithDraft(testingModule, workspaceId);
    const ctx = agentsCtx(testingModule, workspaceId);
    const { firstId, secondId, revision } = await publishTwice(ctx, workspaceId, seeded);

    const attempt = rollbackAgent.execute(ctx, {
      versionId: firstId,
      revision: DRAFT_INITIAL_REVISION,
    });

    await expect(attempt).rejects.toBeInstanceOf(DraftConflictError);
    const agent = await readAgent(testingModule, workspaceId, seeded.agentId);
    const draft = await readDraft(workspaceId, seeded);
    expect(draft).toMatchObject({ flow: triggerFlow(TEST_NODE_NEW_LABEL), revision });
    expect(agent?.liveVersionId).toBe(ids.fromPublic(IdPrefix.AgentVersion, secondId));
  });

  it('stops on a blocking issue and writes nothing', async () => {
    const workspaceId = ids.generate();
    const seeded = await seedAgentWithDraft(testingModule, workspaceId);
    const brokenId = await seedPublishedVersion(testingModule, workspaceId, seeded.agentId, {
      flow: emptyFlow(),
    });
    const live = await publishDraft(workspaceId, seeded);

    const attempt = rollbackAgent.execute(agentsCtx(testingModule, workspaceId), {
      versionId: ids.toPublic(IdPrefix.AgentVersion, brokenId),
      revision: DRAFT_INITIAL_REVISION,
    });

    await expect(attempt).rejects.toBeInstanceOf(AgentFlowHasBlockingIssuesError);
    const agent = await readAgent(testingModule, workspaceId, seeded.agentId);
    const versions = await readVersions(testingModule, workspaceId, seeded.agentId);
    const draft = await readDraft(workspaceId, seeded);
    expect(agent?.liveVersionId).toBe(live.id);
    expect(versions.map((version) => version.number)).toEqual(
      expect.arrayContaining([FIRST_NUMBER, SECOND_NUMBER, null]),
    );
    expect(versions).toHaveLength(THIRD_NUMBER);
    expect(draft).toMatchObject({ flow: triggerFlow(), revision: DRAFT_INITIAL_REVISION });
  });

  it('refuses the version that is already live', async () => {
    const workspaceId = ids.generate();
    const seeded = await seedAgentWithDraft(testingModule, workspaceId);
    const ctx = agentsCtx(testingModule, workspaceId);
    const { secondId, revision } = await publishTwice(ctx, workspaceId, seeded);

    const attempt = rollbackAgent.execute(ctx, { versionId: secondId, revision });

    await expect(attempt).rejects.toBeInstanceOf(AgentVersionAlreadyLiveError);
  });

  it('does not roll back to the draft itself', async () => {
    const workspaceId = ids.generate();
    const seeded = await seedAgentWithDraft(testingModule, workspaceId);

    const attempt = rollbackAgent.execute(agentsCtx(testingModule, workspaceId), {
      versionId: ids.toPublic(IdPrefix.AgentVersion, seeded.draftId),
      revision: DRAFT_INITIAL_REVISION,
    });

    await expect(attempt).rejects.toBeInstanceOf(AgentVersionNotFoundError);
  });

  it('refuses a role that can edit but not publish', async () => {
    const workspaceId = ids.generate();
    const seeded = await seedAgentWithDraft(testingModule, workspaceId);
    const ctx = agentsCtx(testingModule, workspaceId);
    const { firstId, revision } = await publishTwice(ctx, workspaceId, seeded);

    const attempt = rollbackAgent.execute(
      {
        ...ctx,
        permissions: new Set([
          permissionKey(PermissionResource.Agents, PermissionAction.View),
          permissionKey(PermissionResource.Agents, PermissionAction.Edit),
        ]),
      },
      { versionId: firstId, revision },
    );

    await expect(attempt).rejects.toBeInstanceOf(PermissionDeniedError);
  });
});
