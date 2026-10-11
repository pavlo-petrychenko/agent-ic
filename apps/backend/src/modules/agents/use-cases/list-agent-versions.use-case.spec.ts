import { WorkspaceRole } from '@agent-ic/contracts';
import type { TestingModule } from '@nestjs/testing';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AgentVersionKind, AgentVersionStatus } from '@/modules/agents/constants/agent.constants';
import { AgentNotFoundError } from '@/modules/agents/errors/agent-not-found.error';
import { AgentPublishingService } from '@/modules/agents/services/agent-publishing.service';
import { ListAgentVersionsUseCase } from '@/modules/agents/use-cases/list-agent-versions.use-case';
import { PermissionDeniedError } from '@/platform/context/errors/permission-denied.error';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { IdService } from '@/platform/ids/services/id.service';
import { TEST_AUTHOR_NAME } from '@test/support/constants/agents-testing.constants';
import {
  agentsCtx,
  createAgentsTestingModule,
  publicAgentId,
  seedAgentWithDraft,
  seedAuthor,
} from '@test/support/helpers/agents-testing.helpers';

const FIRST_NUMBER = 1;
const SECOND_NUMBER = 2;

describe('ListAgentVersionsUseCase', () => {
  let testingModule: TestingModule;
  let listVersions: ListAgentVersionsUseCase;
  let ids: IdService;

  beforeAll(async () => {
    testingModule = await createAgentsTestingModule();
    listVersions = testingModule.get(ListAgentVersionsUseCase);
    ids = testingModule.get(IdService);
  });

  afterAll(async () => {
    await testingModule.close();
  });

  it('lists the published versions, newest first, without the draft', async () => {
    const workspaceId = ids.generate();
    const { agentId } = await seedAgentWithDraft(testingModule, workspaceId);
    const authorId = await seedAuthor(testingModule);
    const publishing = testingModule.get(AgentPublishingService);
    await testingModule.get(TenantTransactionService).run(workspaceId, async () => {
      await publishing.publish(workspaceId, agentId, { authorId });
      await publishing.publish(workspaceId, agentId, { authorId: ids.generate() });
    });

    const versions = await listVersions.execute(
      agentsCtx(testingModule, workspaceId, WorkspaceRole.Builder),
      { agentId: publicAgentId(testingModule, agentId) },
    );

    expect(versions.map((version) => version.number)).toEqual([SECOND_NUMBER, FIRST_NUMBER]);
    expect(versions.every((version) => version.kind === AgentVersionKind.Published)).toBe(true);
    expect(versions.map((version) => version.status)).toEqual([
      AgentVersionStatus.Live,
      AgentVersionStatus.Archived,
    ]);
    expect(versions.map((version) => version.author)).toEqual([null, { name: TEST_AUTHOR_NAME }]);
  });

  it('does not find an agent of another workspace', async () => {
    const { agentId } = await seedAgentWithDraft(testingModule, ids.generate());

    const attempt = listVersions.execute(agentsCtx(testingModule, ids.generate()), {
      agentId: publicAgentId(testingModule, agentId),
    });

    await expect(attempt).rejects.toBeInstanceOf(AgentNotFoundError);
  });

  it('refuses an operator', async () => {
    const workspaceId = ids.generate();
    const { agentId } = await seedAgentWithDraft(testingModule, workspaceId);

    const attempt = listVersions.execute(
      agentsCtx(testingModule, workspaceId, WorkspaceRole.Operator),
      { agentId: publicAgentId(testingModule, agentId) },
    );

    await expect(attempt).rejects.toBeInstanceOf(PermissionDeniedError);
  });
});
