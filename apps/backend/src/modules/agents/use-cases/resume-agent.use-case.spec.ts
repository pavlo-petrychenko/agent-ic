import { WorkspaceRole } from '@agent-ic/contracts';
import type { TestingModule } from '@nestjs/testing';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AgentStatus, PauseMode } from '@/modules/agents/constants/agent.constants';
import { AgentNotFoundError } from '@/modules/agents/errors/agent-not-found.error';
import { PauseAgentUseCase } from '@/modules/agents/use-cases/pause-agent.use-case';
import { ResumeAgentUseCase } from '@/modules/agents/use-cases/resume-agent.use-case';
import { PermissionDeniedError } from '@/platform/context/errors/permission-denied.error';
import { IdService } from '@/platform/ids/services/id.service';
import { TEST_AWAY_MESSAGE } from '@test/support/constants/agents-testing.constants';
import {
  agentsCtx,
  createAgentsTestingModule,
  makeAgentLive,
  publicAgentId,
  readAgent,
  seedAgentWithDraft,
} from '@test/support/helpers/agents-testing.helpers';

describe('ResumeAgentUseCase', () => {
  let testingModule: TestingModule;
  let pauseAgent: PauseAgentUseCase;
  let resumeAgent: ResumeAgentUseCase;
  let ids: IdService;

  beforeAll(async () => {
    testingModule = await createAgentsTestingModule();
    pauseAgent = testingModule.get(PauseAgentUseCase);
    resumeAgent = testingModule.get(ResumeAgentUseCase);
    ids = testingModule.get(IdService);
  });

  afterAll(async () => {
    await testingModule.close();
  });

  it('clears the pause settings and the agent is live again', async () => {
    const workspaceId = ids.generate();
    const seeded = await seedAgentWithDraft(testingModule, workspaceId);
    await makeAgentLive(testingModule, workspaceId, seeded);
    const id = publicAgentId(testingModule, seeded.agentId);
    const ctx = agentsCtx(testingModule, workspaceId);
    await pauseAgent.execute(ctx, {
      id,
      mode: PauseMode.AwayMessage,
      awayMessage: TEST_AWAY_MESSAGE,
    });

    const view = await resumeAgent.execute(ctx, { id });

    const stored = await readAgent(testingModule, workspaceId, seeded.agentId);
    expect(view).toMatchObject({
      status: AgentStatus.Live,
      pausedAt: null,
      pauseMode: null,
      awayMessage: null,
    });
    expect(stored).toMatchObject({ pausedAt: null, pauseMode: null, awayMessage: null });
  });

  it('leaves an agent that is not paused as it is', async () => {
    const workspaceId = ids.generate();
    const { agentId } = await seedAgentWithDraft(testingModule, workspaceId);
    const before = await readAgent(testingModule, workspaceId, agentId);

    const view = await resumeAgent.execute(agentsCtx(testingModule, workspaceId), {
      id: publicAgentId(testingModule, agentId),
    });

    const after = await readAgent(testingModule, workspaceId, agentId);
    expect(view.status).toBe(AgentStatus.Draft);
    expect(after).toEqual(before);
  });

  it('does not find an agent of another workspace', async () => {
    const { agentId } = await seedAgentWithDraft(testingModule, ids.generate());

    const attempt = resumeAgent.execute(agentsCtx(testingModule, ids.generate()), {
      id: publicAgentId(testingModule, agentId),
    });

    await expect(attempt).rejects.toBeInstanceOf(AgentNotFoundError);
  });

  it('refuses an operator', async () => {
    const workspaceId = ids.generate();
    const { agentId } = await seedAgentWithDraft(testingModule, workspaceId);

    const attempt = resumeAgent.execute(
      agentsCtx(testingModule, workspaceId, WorkspaceRole.Operator),
      { id: publicAgentId(testingModule, agentId) },
    );

    await expect(attempt).rejects.toBeInstanceOf(PermissionDeniedError);
  });
});
