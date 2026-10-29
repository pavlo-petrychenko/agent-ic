import { IdPrefix, WorkspaceRole } from '@agent-ic/contracts';
import { INACTIVITY_UNIT_MINUTES, InactivityUnit } from '@agent-ic/flow';
import type { FlowDocument } from '@agent-ic/flow';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { ConversationNotFoundError } from '@/modules/conversations';
import { RunStatus, RunTrigger } from '@/modules/runs/constants/run.constants';
import { ConversationBusyError } from '@/modules/runs/errors/conversation-busy.error';
import { InactivityAttemptsUsedError } from '@/modules/runs/errors/inactivity-attempts-used.error';
import { NoInactivityTriggerError } from '@/modules/runs/errors/no-inactivity-trigger.error';
import { ArmInactivityOnHandBackUseCase } from '@/modules/runs/use-cases/arm-inactivity-on-hand-back.use-case';
import { SimulateSilenceUseCase } from '@/modules/runs/use-cases/simulate-silence.use-case';
import { TEST_EDITOR_ID, TEST_NODE_ID } from '@test/support/constants/agents-testing.constants';
import { RETRYABLE_ATTEMPT } from '@test/support/constants/async-jobs.constants';
import {
  FIRST_STEP_ID,
  FIRST_STEP_KEY,
  INACTIVITY_NODE_ID,
  TEST_REPEAT_HOURS,
  TEST_SILENT_MINUTES,
} from '@test/support/constants/runs-testing.constants';
import { TestRedisPrefix } from '@test/support/constants/test-infrastructure.constants';
import {
  agentNode,
  flowEdge,
  inactivityTriggerNode,
  stepFlow,
} from '@test/support/fixtures/runs.fixture';
import { workspaceCtx } from '@test/support/fixtures/workspace.fixture';
import {
  createRunLifecycleTestbed,
  receiveMessage,
  seedLiveConversation,
  seedSimulatedConversation,
} from '@test/support/helpers/runs-testing.helpers';
import type {
  LiveConversation,
  RunLifecycleTestbed,
} from '@test/support/typedefs/runs-testing.typedefs';

const followUpFlow: FlowDocument = stepFlow(
  [inactivityTriggerNode(), agentNode(FIRST_STEP_ID, FIRST_STEP_KEY)],
  [flowEdge(TEST_NODE_ID, FIRST_STEP_ID), flowEdge(INACTIVITY_NODE_ID, FIRST_STEP_ID)],
);

const plainFlow: FlowDocument = stepFlow(
  [agentNode(FIRST_STEP_ID, FIRST_STEP_KEY)],
  [flowEdge(TEST_NODE_ID, FIRST_STEP_ID)],
);

describe('SimulateSilenceUseCase', () => {
  let testbed: RunLifecycleTestbed;

  const execute = (seeded: LiveConversation, runId: string) =>
    testbed.executeRun.execute(seeded.ctx, { runId }, RETRYABLE_ATTEMPT);

  const answeredSimulation = async (flow: FlowDocument = followUpFlow, pinned: boolean = true) => {
    const seeded = await seedSimulatedConversation(testbed, flow, TEST_EDITOR_ID, pinned);
    const { run } = await receiveMessage(testbed, seeded, { versionId: seeded.versionId });
    await execute(seeded, String(run?.id));
    return seeded;
  };

  const simulateSilence = ({ conversation }: LiveConversation, userId: string = TEST_EDITOR_ID) =>
    testbed.module
      .get(SimulateSilenceUseCase)
      .execute(workspaceCtx(userId, conversation.workspaceId, WorkspaceRole.Builder), {
        conversationId: testbed.ids.toPublic(IdPrefix.Conversation, conversation.id),
      });

  const storedRun = ({ conversation: { workspaceId } }: LiveConversation, publicId: string) =>
    testbed.tenants.run(workspaceId, () =>
      testbed.runs.findById(workspaceId, testbed.ids.fromPublic(IdPrefix.Run, publicId)),
    );

  beforeAll(async () => {
    testbed = await createRunLifecycleTestbed(TestRedisPrefix.RunSimulateSilence);
  });

  afterAll(async () => {
    await testbed.module.close();
  });

  it('fires each attempt now with its own silence, then refuses once every attempt is used', async () => {
    const seeded = await answeredSimulation();

    const first = await simulateSilence(seeded);
    expect(first).toMatchObject({
      trigger: RunTrigger.Inactivity,
      inactivityAttempt: 1,
      status: RunStatus.Queued,
    });
    expect((await storedRun(seeded, first.id))?.triggerInput).toEqual({
      attempt: 1,
      silentMinutes: TEST_SILENT_MINUTES,
    });
    await execute(seeded, testbed.ids.fromPublic(IdPrefix.Run, first.id));

    const second = await simulateSilence(seeded);
    expect((await storedRun(seeded, second.id))?.triggerInput).toEqual({
      attempt: 2,
      silentMinutes:
        TEST_SILENT_MINUTES + TEST_REPEAT_HOURS * INACTIVITY_UNIT_MINUTES[InactivityUnit.Hours],
    });
    await execute(seeded, testbed.ids.fromPublic(IdPrefix.Run, second.id));

    await expect(simulateSilence(seeded)).rejects.toBeInstanceOf(InactivityAttemptsUsedError);
  });

  it('fires a draft simulation from a snapshot of the draft', async () => {
    const seeded = await answeredSimulation(followUpFlow, false);

    const first = await simulateSilence(seeded);

    expect(first).toMatchObject({ trigger: RunTrigger.Inactivity, inactivityAttempt: 1 });
    expect((await storedRun(seeded, first.id))?.versionId).not.toBe(seeded.versionId);
  });

  it('arms a draft simulation again after a hand-back', async () => {
    const seeded = await answeredSimulation(followUpFlow, false);
    const { workspaceId, id, agentId, mode } = seeded.conversation;
    await testbed.tenants.run(workspaceId, () => testbed.timers.disarm(workspaceId, id));

    await testbed.module
      .get(ArmInactivityOnHandBackUseCase)
      .execute(seeded.ctx, { conversationId: id, agentId, mode });

    expect(await simulateSilence(seeded)).toMatchObject({ inactivityAttempt: 1 });
  });

  it('refuses a flow without an inactivity trigger', async () => {
    const seeded = await answeredSimulation(plainFlow);

    await expect(simulateSilence(seeded)).rejects.toBeInstanceOf(NoInactivityTriggerError);
  });

  it('refuses while a run works on the conversation', async () => {
    const seeded = await answeredSimulation();
    await receiveMessage(testbed, seeded, { versionId: seeded.versionId });

    await expect(simulateSilence(seeded)).rejects.toBeInstanceOf(ConversationBusyError);
  });

  it('hides the simulation of another person and every live conversation', async () => {
    const seeded = await answeredSimulation();
    const live = await seedLiveConversation(testbed, followUpFlow);

    await expect(simulateSilence(seeded, testbed.ids.generate())).rejects.toBeInstanceOf(
      ConversationNotFoundError,
    );
    await expect(simulateSilence(live)).rejects.toBeInstanceOf(ConversationNotFoundError);
  });
});
