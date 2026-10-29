import { WorkspaceRole } from '@agent-ic/contracts';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  CloseReason,
  ConversationMode,
  ConversationState,
} from '@/modules/conversations/constants/conversation.constants';
import { AutoCloseOffError } from '@/modules/conversations/errors/auto-close-off.error';
import { ConversationClosedError } from '@/modules/conversations/errors/conversation-closed.error';
import { ConversationNotAutoClosableError } from '@/modules/conversations/errors/conversation-not-auto-closable.error';
import { ConversationNotFoundError } from '@/modules/conversations/errors/conversation-not-found.error';
import { CloseSimulationForInactivityUseCase } from '@/modules/conversations/use-cases/close-simulation-for-inactivity.use-case';
import { PermissionDeniedError } from '@/platform/context/errors/permission-denied.error';
import { AUTO_CLOSE_TEST_MINUTES } from '@test/support/constants/conversations-testing.constants';
import { autoCloseFlow, triggerFlow } from '@test/support/fixtures/agents.fixture';
import { seedPublishedVersion } from '@test/support/helpers/agents-testing.helpers';
import { createConversationsTestbed } from '@test/support/helpers/conversations-testing.helpers';
import { seedRunRow } from '@test/support/helpers/parent-rows.helpers';
import { startTestSimulation } from '@test/support/helpers/simulator-testing.helpers';
import type { ConversationsTestbed } from '@test/support/typedefs/conversations-testing.typedefs';
import type { StartedSimulation } from '@test/support/typedefs/simulator-testing.typedefs';

describe('CloseSimulationForInactivityUseCase', () => {
  let testbed: ConversationsTestbed;
  let closeForInactivity: CloseSimulationForInactivityUseCase;

  const startWithDraftClosing = (afterMinutes: number | null): Promise<StartedSimulation> =>
    startTestSimulation(
      testbed,
      () => Promise.resolve(null),
      autoCloseFlow(afterMinutes, triggerFlow()),
    );

  const close = ({ ctx, simulation }: StartedSimulation) =>
    closeForInactivity.execute(ctx, { conversationId: simulation.conversation.id });

  beforeAll(async () => {
    testbed = await createConversationsTestbed();
    closeForInactivity = testbed.module.get(CloseSimulationForInactivityUseCase);
  });

  afterAll(async () => {
    await testbed.module.close();
  });

  it('closes a test chat of a draft with auto-close on, with reason inactivity', async () => {
    const started = await startWithDraftClosing(AUTO_CLOSE_TEST_MINUTES);

    const closed = await close(started);

    expect(closed.conversation).toEqual({
      ...started.simulation.conversation,
      state: ConversationState.Closed,
      closeReason: CloseReason.Inactivity,
    });
  });

  it('refuses when auto-close is off for the simulated draft', async () => {
    const started = await startWithDraftClosing(null);

    await expect(close(started)).rejects.toBeInstanceOf(AutoCloseOffError);
  });

  it('reads the setting of the pinned published version, not the draft', async () => {
    const pinnedOn = await startTestSimulation(testbed, (agentId, workspaceId) =>
      seedPublishedVersion(testbed.module, workspaceId, agentId, {
        flow: autoCloseFlow(AUTO_CLOSE_TEST_MINUTES, triggerFlow()),
      }),
    );
    const pinnedOff = await startTestSimulation(
      testbed,
      (agentId, workspaceId) => seedPublishedVersion(testbed.module, workspaceId, agentId),
      autoCloseFlow(AUTO_CLOSE_TEST_MINUTES, triggerFlow()),
    );

    expect((await close(pinnedOn)).conversation.closeReason).toBe(CloseReason.Inactivity);
    await expect(close(pinnedOff)).rejects.toBeInstanceOf(AutoCloseOffError);
  });

  it('refuses a chat that is already closed', async () => {
    const started = await startWithDraftClosing(AUTO_CLOSE_TEST_MINUTES);
    await close(started);

    await expect(close(started)).rejects.toBeInstanceOf(ConversationClosedError);
  });

  it('refuses a waiting chat and a chat with a run in progress', async () => {
    const waiting = await startWithDraftClosing(AUTO_CLOSE_TEST_MINUTES);
    await testbed.tenants.run(waiting.workspaceId, () =>
      testbed.conversations.markWaiting(waiting.workspaceId, waiting.conversationId),
    );
    const busy = await startWithDraftClosing(AUTO_CLOSE_TEST_MINUTES);
    const runId = await seedRunRow(testbed.module, {
      id: busy.conversationId,
      workspaceId: busy.workspaceId,
      agentId: busy.agentId,
      mode: ConversationMode.Simulation,
    });
    await testbed.tenants.run(busy.workspaceId, () =>
      testbed.runs.claimRun(busy.workspaceId, busy.conversationId, runId),
    );

    await expect(close(waiting)).rejects.toBeInstanceOf(ConversationNotAutoClosableError);
    await expect(close(busy)).rejects.toBeInstanceOf(ConversationNotAutoClosableError);
  });

  it('refuses another workspace and an operator', async () => {
    const started = await startWithDraftClosing(AUTO_CLOSE_TEST_MINUTES);
    const input = { conversationId: started.simulation.conversation.id };

    await expect(
      closeForInactivity.execute({ ...started.ctx, workspaceId: testbed.ids.generate() }, input),
    ).rejects.toBeInstanceOf(ConversationNotFoundError);
    await expect(
      closeForInactivity.execute({ ...started.ctx, workspaceRole: WorkspaceRole.Operator }, input),
    ).rejects.toBeInstanceOf(PermissionDeniedError);
  });
});
