import { WorkspaceRole } from '@agent-ic/contracts';
import type { TestingModule } from '@nestjs/testing';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AgentStatus } from '@/modules/agents/constants/agent.constants';
import { AgentNotFoundError } from '@/modules/agents/errors/agent-not-found.error';
import { GetAgentUseCase } from '@/modules/agents/use-cases/get-agent.use-case';
import { PermissionDeniedError } from '@/platform/context/errors/permission-denied.error';
import { IdService } from '@/platform/ids/services/id.service';
import { TEST_AGENT_NAME } from '@test/support/constants/agents-testing.constants';
import {
  agentsCtx,
  createAgentsTestingModule,
  makeAgentLive,
  publicAgentId,
  seedAgentWithDraft,
} from '@test/support/helpers/agents-testing.helpers';

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
