import { InactivityActivity } from '@agent-ic/flow';
import type { FlowDocument } from '@agent-ic/flow';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { RunTrigger, TriggeredRunOutcome } from '@/modules/runs/constants/run.constants';
import { inactivityTriggerInput } from '@/modules/runs/helpers/inactivity-trigger.helpers';
import { RunLifecycleService } from '@/modules/runs/services/run-lifecycle.service';
import { ArmInactivityOnHandBackUseCase } from '@/modules/runs/use-cases/arm-inactivity-on-hand-back.use-case';
import {
  MILLISECONDS_PER_SECOND,
  SECONDS_PER_HOUR,
} from '@/platform/clock/constants/time.constants';
import { TEST_NODE_ID } from '@test/support/constants/agents-testing.constants';
import { RETRYABLE_ATTEMPT } from '@test/support/constants/async-jobs.constants';
import {
  AgentChange,
  FIRST_STEP_ID,
  FIRST_STEP_KEY,
  INACTIVITY_NODE_ID,
  TEST_REPEAT_HOURS,
  TEST_SILENCE_HOURS,
  TEST_SILENT_MINUTES,
} from '@test/support/constants/runs-testing.constants';
import { TestRedisPrefix } from '@test/support/constants/test-infrastructure.constants';
import {
  agentNode,
  flowEdge,
  inactivityTriggerNode,
  stepFlow,
} from '@test/support/fixtures/runs.fixture';
import {
  changeAgent,
  createRunLifecycleTestbed,
  markConversationWaiting,
  receiveMessage,
  recordCustomerMessageAt,
  seedLiveConversation,
} from '@test/support/helpers/runs-testing.helpers';
import type {
  LiveConversation,
  RunLifecycleTestbed,
} from '@test/support/typedefs/runs-testing.typedefs';

const hours = (count: number): number => count * SECONDS_PER_HOUR * MILLISECONDS_PER_SECOND;

const followUpFlow = (activity: InactivityActivity = InactivityActivity.Any): FlowDocument =>
  stepFlow(
    [inactivityTriggerNode({ activity }), agentNode(FIRST_STEP_ID, FIRST_STEP_KEY)],
    [flowEdge(TEST_NODE_ID, FIRST_STEP_ID), flowEdge(INACTIVITY_NODE_ID, FIRST_STEP_ID)],
  );

const plainFlow = stepFlow(
  [agentNode(FIRST_STEP_ID, FIRST_STEP_KEY)],
  [flowEdge(TEST_NODE_ID, FIRST_STEP_ID)],
);

describe('InactivityTimersService', () => {
  let testbed: RunLifecycleTestbed;

  const execute = (seeded: LiveConversation, runId: string | undefined) =>
    testbed.executeRun.execute(seeded.ctx, { runId: String(runId) }, RETRYABLE_ATTEMPT);

  const answer = async (seeded: LiveConversation): Promise<void> => {
    const { run } = await receiveMessage(testbed, seeded);
    await execute(seeded, run?.id);
  };

  const answered = async (flow: FlowDocument = followUpFlow()): Promise<LiveConversation> => {
    const seeded = await seedLiveConversation(testbed, flow);
    await answer(seeded);
    return seeded;
  };

  const timerOf = ({ conversation: { workspaceId, id } }: LiveConversation) =>
    testbed.tenants.run(workspaceId, () => testbed.timers.findByConversation(workspaceId, id));

  const startFollowUp = async (seeded: LiveConversation, attempt: number): Promise<string> => {
    const { workspaceId, id } = seeded.conversation;
    const started = await testbed.tenants.run(workspaceId, () =>
      testbed.module.get(RunLifecycleService).startTriggeredRun(seeded.ctx, {
        workspaceId,
        conversationId: id,
        versionId: seeded.versionId,
        trigger: RunTrigger.Inactivity,
        triggerNodeId: INACTIVITY_NODE_ID,
        triggerInput: inactivityTriggerInput({ attempt, silentMinutes: TEST_SILENT_MINUTES }),
      }),
    );
    expect(started.outcome).toBe(TriggeredRunOutcome.Started);
    return started.outcome === TriggeredRunOutcome.Started ? started.run.id : '';
  };

  const followUp = async (seeded: LiveConversation, attempt: number): Promise<void> => {
    await execute(seeded, await startFollowUp(seeded, attempt));
  };

  beforeAll(async () => {
    testbed = await createRunLifecycleTestbed(TestRedisPrefix.RunInactivity);
  });

  afterAll(async () => {
    await testbed.module.close();
  });

  it('arms the first attempt from the end of a message run on the live version', async () => {
    const seeded = await answered();
    const endedAt = testbed.clock.now();

    expect(await timerOf(seeded)).toMatchObject({
      versionId: seeded.versionId,
      nodeId: INACTIVITY_NODE_ID,
      anchorAt: endedAt,
      attempt: 0,
      dueAt: new Date(endedAt.getTime() + hours(TEST_SILENCE_HOURS)),
      leaseUntil: null,
    });
  });

  it('anchors on the last customer message when only customer messages count', async () => {
    const seeded = await seedLiveConversation(testbed, followUpFlow(InactivityActivity.Customer));
    const wroteAt = testbed.clock.now();
    await recordCustomerMessageAt(testbed, seeded, wroteAt);
    testbed.clock.advanceBy(hours(1));
    await answer(seeded);

    expect(await timerOf(seeded)).toMatchObject({
      anchorAt: wroteAt,
      dueAt: new Date(wroteAt.getTime() + hours(TEST_SILENCE_HOURS)),
    });
  });

  it('keeps the anchor after a follow-up and drops the timer once every attempt is used', async () => {
    const seeded = await answered();
    const armed = await timerOf(seeded);
    testbed.clock.advanceBy(hours(TEST_SILENCE_HOURS));

    await followUp(seeded, 1);

    const anchorAt = armed?.anchorAt ?? testbed.clock.now();
    expect(await timerOf(seeded)).toMatchObject({
      anchorAt,
      attempt: 1,
      dueAt: new Date(anchorAt.getTime() + hours(TEST_SILENCE_HOURS + TEST_REPEAT_HOURS)),
    });

    await followUp(seeded, 2);

    expect(await timerOf(seeded)).toBeNull();
  });

  it('cancels the timer when the customer writes and arms it again after the answer', async () => {
    const seeded = await answered();

    const { run } = await receiveMessage(testbed, seeded);

    expect(await timerOf(seeded)).toBeNull();
    await execute(seeded, run?.id);
    expect(await timerOf(seeded)).toMatchObject({ attempt: 0, anchorAt: testbed.clock.now() });
  });

  it('cancels the timer when a follow-up ends with the conversation waiting for a person', async () => {
    const seeded = await answered();
    const runId = await startFollowUp(seeded, 1);
    await markConversationWaiting(testbed, seeded);

    await execute(seeded, runId);

    expect(await timerOf(seeded)).toBeNull();
  });

  it('arms nothing when the live version has no inactivity trigger', async () => {
    expect(await timerOf(await answered(plainFlow))).toBeNull();
  });

  it('cancels the timer when the agent is paused before the follow-up ends', async () => {
    const seeded = await answered();
    const runId = await startFollowUp(seeded, 1);
    await changeAgent(testbed, seeded, AgentChange.PauseWithAwayMessage);

    await execute(seeded, runId);

    expect(await timerOf(seeded)).toBeNull();
  });

  it('arms the first attempt again when an operator hands the conversation back', async () => {
    const seeded = await answered();
    await followUp(seeded, 1);
    testbed.clock.advanceBy(hours(1));

    await testbed.module.get(ArmInactivityOnHandBackUseCase).execute(seeded.ctx, {
      conversationId: seeded.conversation.id,
      agentId: seeded.conversation.agentId,
      mode: seeded.conversation.mode,
    });

    expect(await timerOf(seeded)).toMatchObject({ attempt: 0, anchorAt: testbed.clock.now() });
  });
});
