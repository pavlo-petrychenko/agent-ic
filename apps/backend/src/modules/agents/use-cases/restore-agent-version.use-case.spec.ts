import { IdPrefix, WorkspaceRole } from '@agent-ic/contracts';
import type { TestingModule } from '@nestjs/testing';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { DRAFT_INITIAL_REVISION } from '@/modules/agents/constants/agent.constants';
import { AgentVersionNotFoundError } from '@/modules/agents/errors/agent-version-not-found.error';
import { DraftConflictError } from '@/modules/agents/errors/draft-conflict.error';
import { AgentPublishingService } from '@/modules/agents/services/agent-publishing.service';
import type { RestoreAgentVersionInput } from '@/modules/agents/typedefs/agent-version.typedefs';
import { GetAgentUseCase } from '@/modules/agents/use-cases/get-agent.use-case';
import { RestoreAgentVersionUseCase } from '@/modules/agents/use-cases/restore-agent-version.use-case';
import { SaveAgentDraftUseCase } from '@/modules/agents/use-cases/save-agent-draft.use-case';
import { PermissionDeniedError } from '@/platform/context/errors/permission-denied.error';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { IdService } from '@/platform/ids/services/id.service';
import {
  TEST_EDITOR_ID,
  TEST_NODE_NEW_LABEL,
} from '@test/support/constants/agents-testing.constants';
import { triggerFlow } from '@test/support/fixtures/agents.fixture';
import {
  agentsCtx,
  createAgentsTestingModule,
  publicAgentId,
  readVersions,
  seedAgentWithDraft,
} from '@test/support/helpers/agents-testing.helpers';
import type { SeededAgent } from '@test/support/typedefs/agents-testing.typedefs';

const FIRST_NUMBER = 1;

describe('RestoreAgentVersionUseCase', () => {
  let testingModule: TestingModule;
  let restoreVersion: RestoreAgentVersionUseCase;
  let ids: IdService;

  const publishThenEdit = async (
    ctx: UseCaseCtx,
    workspaceId: string,
    seeded: SeededAgent,
  ): Promise<RestoreAgentVersionInput> => {
    const published = await testingModule
      .get(TenantTransactionService)
      .run(workspaceId, () =>
        testingModule
          .get(AgentPublishingService)
          .publish(workspaceId, seeded.agentId, { authorId: TEST_EDITOR_ID }),
      );
    const saved = await testingModule.get(SaveAgentDraftUseCase).execute(ctx, {
      id: publicAgentId(testingModule, seeded.agentId),
      flow: triggerFlow(TEST_NODE_NEW_LABEL),
      revision: DRAFT_INITIAL_REVISION,
    });
    return {
      versionId: ids.toPublic(IdPrefix.AgentVersion, published.id),
      revision: saved.revision,
    };
  };

  const readDraft = async (workspaceId: string, seeded: SeededAgent) =>
    (await readVersions(testingModule, workspaceId, seeded.agentId)).find(
      (version) => version.id === seeded.draftId,
    );

  beforeAll(async () => {
    testingModule = await createAgentsTestingModule();
    restoreVersion = testingModule.get(RestoreAgentVersionUseCase);
    ids = testingModule.get(IdService);
  });

  afterAll(async () => {
    await testingModule.close();
  });

  it('lets a builder copy a published flow over the draft', async () => {
    const workspaceId = ids.generate();
    const seeded = await seedAgentWithDraft(testingModule, workspaceId);
    const ctx = agentsCtx(testingModule, workspaceId, WorkspaceRole.Builder);
    const { versionId, revision } = await publishThenEdit(ctx, workspaceId, seeded);

    const restored = await restoreVersion.execute(ctx, { versionId, revision });

    const agent = await testingModule
      .get(GetAgentUseCase)
      .execute(ctx, { id: publicAgentId(testingModule, seeded.agentId) });
    const draft = await readDraft(workspaceId, seeded);
    expect(restored.revision).toBe(revision + 1);
    expect(restored.version.flow).toEqual(triggerFlow());
    expect(draft).toMatchObject({ flow: triggerFlow(), revision: revision + 1 });
    expect(agent).toMatchObject({
      draftBaseVersionNumber: FIRST_NUMBER,
      hasUnpublishedChanges: false,
      draftChangeCount: 0,
    });
  });

  it('refuses a stale revision and leaves the draft as it was', async () => {
    const workspaceId = ids.generate();
    const seeded = await seedAgentWithDraft(testingModule, workspaceId);
    const ctx = agentsCtx(testingModule, workspaceId);
    const { versionId, revision } = await publishThenEdit(ctx, workspaceId, seeded);

    const attempt = restoreVersion.execute(ctx, { versionId, revision: DRAFT_INITIAL_REVISION });

    await expect(attempt).rejects.toBeInstanceOf(DraftConflictError);
    const draft = await readDraft(workspaceId, seeded);
    expect(draft).toMatchObject({ flow: triggerFlow(TEST_NODE_NEW_LABEL), revision });
  });

  it('does not restore the draft itself', async () => {
    const workspaceId = ids.generate();
    const seeded = await seedAgentWithDraft(testingModule, workspaceId);

    const attempt = restoreVersion.execute(agentsCtx(testingModule, workspaceId), {
      versionId: ids.toPublic(IdPrefix.AgentVersion, seeded.draftId),
      revision: DRAFT_INITIAL_REVISION,
    });

    await expect(attempt).rejects.toBeInstanceOf(AgentVersionNotFoundError);
  });

  it('does not find a version of another workspace', async () => {
    const workspaceId = ids.generate();
    const seeded = await seedAgentWithDraft(testingModule, workspaceId);
    const { versionId, revision } = await publishThenEdit(
      agentsCtx(testingModule, workspaceId),
      workspaceId,
      seeded,
    );

    const attempt = restoreVersion.execute(agentsCtx(testingModule, ids.generate()), {
      versionId,
      revision,
    });

    await expect(attempt).rejects.toBeInstanceOf(AgentVersionNotFoundError);
  });

  it('refuses an operator', async () => {
    const workspaceId = ids.generate();
    const seeded = await seedAgentWithDraft(testingModule, workspaceId);
    const { versionId, revision } = await publishThenEdit(
      agentsCtx(testingModule, workspaceId),
      workspaceId,
      seeded,
    );

    const attempt = restoreVersion.execute(
      agentsCtx(testingModule, workspaceId, WorkspaceRole.Operator),
      { versionId, revision },
    );

    await expect(attempt).rejects.toBeInstanceOf(PermissionDeniedError);
  });
});
