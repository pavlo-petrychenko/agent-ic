import { WorkspaceRole } from '@agent-ic/contracts';
import type { TestingModule } from '@nestjs/testing';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { DRAFT_INITIAL_REVISION } from '@/modules/agents/constants/agent.constants';
import { AgentVersionsRepository } from '@/modules/agents/repositories/agent-versions.repository';
import { AgentPublishingService } from '@/modules/agents/services/agent-publishing.service';
import { CountDraftChangesUseCase } from '@/modules/agents/use-cases/count-draft-changes.use-case';
import { PermissionDeniedError } from '@/platform/context/errors/permission-denied.error';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { IdService } from '@/platform/ids/services/id.service';
import {
  AGENTS_TEST_LATER,
  TEST_EDITOR_ID,
  TEST_NODE_NEW_LABEL,
} from '@test/support/constants/agents-testing.constants';
import { triggerFlow } from '@test/support/fixtures/agents.fixture';
import {
  agentsCtx,
  createAgentsTestingModule,
  publicAgentId,
  seedAgentWithDraft,
} from '@test/support/helpers/agents-testing.helpers';

const TRIGGER_FLOW_ITEMS = 3;

describe('CountDraftChangesUseCase', () => {
  let testingModule: TestingModule;
  let countChanges: CountDraftChangesUseCase;
  let ids: IdService;

  const seedAgents = async (workspaceId: string) => {
    const tenants = testingModule.get(TenantTransactionService);
    const publishing = testingModule.get(AgentPublishingService);
    const neverPublished = await seedAgentWithDraft(testingModule, workspaceId);
    const published = await seedAgentWithDraft(testingModule, workspaceId);
    const edited = await seedAgentWithDraft(testingModule, workspaceId);
    await tenants.run(workspaceId, async () => {
      await publishing.publish(workspaceId, published.agentId, { authorId: TEST_EDITOR_ID });
      await publishing.publish(workspaceId, edited.agentId, { authorId: TEST_EDITOR_ID });
      await testingModule
        .get(AgentVersionsRepository)
        .updateDraft(
          workspaceId,
          edited.draftId,
          DRAFT_INITIAL_REVISION,
          { flow: triggerFlow(TEST_NODE_NEW_LABEL), note: null, authorId: TEST_EDITOR_ID },
          AGENTS_TEST_LATER,
        );
    });
    return [neverPublished, published, edited].map(({ agentId }) =>
      publicAgentId(testingModule, agentId),
    );
  };

  beforeAll(async () => {
    testingModule = await createAgentsTestingModule();
    countChanges = testingModule.get(CountDraftChangesUseCase);
    ids = testingModule.get(IdService);
  });

  afterAll(async () => {
    await testingModule.close();
  });

  it('counts the draft changes of every agent against its live version', async () => {
    const workspaceId = ids.generate();
    const keys = await seedAgents(workspaceId);

    const counts = await countChanges.execute(agentsCtx(testingModule, workspaceId), keys);

    expect([...counts.values()]).toEqual([TRIGGER_FLOW_ITEMS, 0, 1]);
  });

  it('finds no agents of another workspace', async () => {
    const keys = await seedAgents(ids.generate());

    const counts = await countChanges.execute(agentsCtx(testingModule, ids.generate()), keys);

    expect([...counts.values()]).toEqual([null, null, null]);
  });

  it('refuses an operator', async () => {
    const workspaceId = ids.generate();
    const keys = await seedAgents(workspaceId);

    const attempt = countChanges.execute(
      agentsCtx(testingModule, workspaceId, WorkspaceRole.Operator),
      keys,
    );

    await expect(attempt).rejects.toBeInstanceOf(PermissionDeniedError);
  });
});
