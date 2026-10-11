import { AGENT_AWAY_MESSAGE_MAX_LENGTH, WorkspaceRole } from '@agent-ic/contracts';
import type { TestingModule } from '@nestjs/testing';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { AgentStatus, PauseMode } from '@/modules/agents/constants/agent.constants';
import { AgentNotFoundError } from '@/modules/agents/errors/agent-not-found.error';
import { AwayMessageRequiredError } from '@/modules/agents/errors/away-message-required.error';
import { AwayMessageTooLongError } from '@/modules/agents/errors/away-message-too-long.error';
import { PauseAgentUseCase } from '@/modules/agents/use-cases/pause-agent.use-case';
import { ClockService } from '@/platform/clock/services/clock.service';
import { PermissionDeniedError } from '@/platform/context/errors/permission-denied.error';
import { IdService } from '@/platform/ids/services/id.service';
import {
  AGENTS_TEST_LATER,
  AGENTS_TEST_START,
  TEST_AWAY_MESSAGE,
} from '@test/support/constants/agents-testing.constants';
import {
  agentsCtx,
  createAgentsTestingModule,
  publicAgentId,
  readAgent,
  seedAgentWithDraft,
} from '@test/support/helpers/agents-testing.helpers';

describe('PauseAgentUseCase', () => {
  let testingModule: TestingModule;
  let pauseAgent: PauseAgentUseCase;
  let ids: IdService;

  beforeAll(async () => {
    testingModule = await createAgentsTestingModule();
    pauseAgent = testingModule.get(PauseAgentUseCase);
    ids = testingModule.get(IdService);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  afterAll(async () => {
    await testingModule.close();
  });

  it('pauses to the inbox and keeps no away text', async () => {
    const workspaceId = ids.generate();
    const { agentId } = await seedAgentWithDraft(testingModule, workspaceId);
    vi.spyOn(testingModule.get(ClockService), 'now').mockReturnValue(AGENTS_TEST_START);

    const view = await pauseAgent.execute(agentsCtx(testingModule, workspaceId), {
      id: publicAgentId(testingModule, agentId),
      mode: PauseMode.Inbox,
      awayMessage: TEST_AWAY_MESSAGE,
    });

    const stored = await readAgent(testingModule, workspaceId, agentId);
    expect(view).toMatchObject({
      status: AgentStatus.Paused,
      pauseMode: PauseMode.Inbox,
      awayMessage: null,
      pausedAt: AGENTS_TEST_START,
    });
    expect(stored).toMatchObject({
      pausedAt: AGENTS_TEST_START,
      pauseMode: PauseMode.Inbox,
      awayMessage: null,
    });
  });

  it('pauses with a trimmed away message', async () => {
    const workspaceId = ids.generate();
    const { agentId } = await seedAgentWithDraft(testingModule, workspaceId);

    const view = await pauseAgent.execute(agentsCtx(testingModule, workspaceId), {
      id: publicAgentId(testingModule, agentId),
      mode: PauseMode.AwayMessage,
      awayMessage: `  ${TEST_AWAY_MESSAGE}  `,
    });

    const stored = await readAgent(testingModule, workspaceId, agentId);
    expect(view).toMatchObject({
      pauseMode: PauseMode.AwayMessage,
      awayMessage: TEST_AWAY_MESSAGE,
    });
    expect(stored).toMatchObject({
      pauseMode: PauseMode.AwayMessage,
      awayMessage: TEST_AWAY_MESSAGE,
    });
  });

  it.each([
    ['is missing', undefined],
    ['is null', null],
    ['is blank', '   '],
  ])('needs a text for the away message when it %s', async (_case, awayMessage) => {
    const workspaceId = ids.generate();
    const { agentId } = await seedAgentWithDraft(testingModule, workspaceId);

    const attempt = pauseAgent.execute(agentsCtx(testingModule, workspaceId), {
      id: publicAgentId(testingModule, agentId),
      mode: PauseMode.AwayMessage,
      awayMessage,
    });

    await expect(attempt).rejects.toBeInstanceOf(AwayMessageRequiredError);
    const stored = await readAgent(testingModule, workspaceId, agentId);
    expect(stored?.pausedAt).toBeNull();
  });

  it('refuses an away message over the limit', async () => {
    const workspaceId = ids.generate();
    const { agentId } = await seedAgentWithDraft(testingModule, workspaceId);

    const attempt = pauseAgent.execute(agentsCtx(testingModule, workspaceId), {
      id: publicAgentId(testingModule, agentId),
      mode: PauseMode.AwayMessage,
      awayMessage: 'a'.repeat(AGENT_AWAY_MESSAGE_MAX_LENGTH + 1),
    });

    await expect(attempt).rejects.toBeInstanceOf(AwayMessageTooLongError);
  });

  it('changes the settings of a paused agent without a new pause time', async () => {
    const workspaceId = ids.generate();
    const { agentId } = await seedAgentWithDraft(testingModule, workspaceId);
    const id = publicAgentId(testingModule, agentId);
    const ctx = agentsCtx(testingModule, workspaceId);
    const now = vi.spyOn(testingModule.get(ClockService), 'now');
    now.mockReturnValue(AGENTS_TEST_START);
    await pauseAgent.execute(ctx, { id, mode: PauseMode.Inbox });
    now.mockReturnValue(AGENTS_TEST_LATER);

    await pauseAgent.execute(ctx, {
      id,
      mode: PauseMode.AwayMessage,
      awayMessage: TEST_AWAY_MESSAGE,
    });

    const stored = await readAgent(testingModule, workspaceId, agentId);
    expect(stored).toMatchObject({
      pausedAt: AGENTS_TEST_START,
      pauseMode: PauseMode.AwayMessage,
      awayMessage: TEST_AWAY_MESSAGE,
      updatedAt: AGENTS_TEST_LATER,
    });
  });

  it('does not find an agent of another workspace', async () => {
    const { agentId } = await seedAgentWithDraft(testingModule, ids.generate());

    const attempt = pauseAgent.execute(agentsCtx(testingModule, ids.generate()), {
      id: publicAgentId(testingModule, agentId),
      mode: PauseMode.Inbox,
    });

    await expect(attempt).rejects.toBeInstanceOf(AgentNotFoundError);
  });

  it('refuses an operator', async () => {
    const workspaceId = ids.generate();
    const { agentId } = await seedAgentWithDraft(testingModule, workspaceId);

    const attempt = pauseAgent.execute(
      agentsCtx(testingModule, workspaceId, WorkspaceRole.Operator),
      { id: publicAgentId(testingModule, agentId), mode: PauseMode.Inbox },
    );

    await expect(attempt).rejects.toBeInstanceOf(PermissionDeniedError);
  });
});
