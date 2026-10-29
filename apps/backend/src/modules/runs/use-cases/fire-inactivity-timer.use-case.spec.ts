import type { FlowDocument } from '@agent-ic/flow';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { MessageAuthor } from '@/modules/conversations';
import { InactivityFireOutcome } from '@/modules/runs/constants/inactivity.constants';
import { RunStatus, RunTrigger } from '@/modules/runs/constants/run.constants';
import { executeProactiveRunJob } from '@/modules/runs/jobs/execute-proactive-run.job';
import { FireInactivityTimerUseCase } from '@/modules/runs/use-cases/fire-inactivity-timer.use-case';
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
  addConversationMessage,
  changeAgent,
  createRunLifecycleTestbed,
  handConversationBack,
  markConversationWaiting,
  readLifecycle,
  receiveMessage,
  recordCustomerMessageAt,
  republish,
  seedLiveConversation,
} from '@test/support/helpers/runs-testing.helpers';
import type {
  LiveConversation,
  RunLifecycleTestbed,
} from '@test/support/typedefs/runs-testing.typedefs';

const SILENCE_MS = TEST_SILENCE_HOURS * SECONDS_PER_HOUR * MILLISECONDS_PER_SECOND;

const followUpFlow: FlowDocument = stepFlow(
  [inactivityTriggerNode(), agentNode(FIRST_STEP_ID, FIRST_STEP_KEY)],
  [flowEdge(TEST_NODE_ID, FIRST_STEP_ID), flowEdge(INACTIVITY_NODE_ID, FIRST_STEP_ID)],
);

describe('FireInactivityTimerUseCase', () => {
  let testbed: RunLifecycleTestbed;

  const execute = (seeded: LiveConversation, runId: string | undefined) =>
    testbed.executeRun.execute(seeded.ctx, { runId: String(runId) }, RETRYABLE_ATTEMPT);

  const answered = async (): Promise<LiveConversation> => {
    const seeded = await seedLiveConversation(testbed, followUpFlow);
    const { run } = await receiveMessage(testbed, seeded);
    await execute(seeded, run?.id);
    return seeded;
  };

  const timerOf = ({ conversation: { workspaceId, id } }: LiveConversation) =>
    testbed.tenants.run(workspaceId, () => testbed.timers.findByConversation(workspaceId, id));

  const fire = async (seeded: LiveConversation) => {
    const timer = await timerOf(seeded);
    return testbed.module
      .get(FireInactivityTimerUseCase)
      .execute(seeded.ctx, { timerId: String(timer?.id) });
  };

  const silentAndDue = async (): Promise<LiveConversation> => {
    const seeded = await answered();
    testbed.clock.advanceBy(SILENCE_MS);
    return seeded;
  };

  beforeAll(async () => {
    testbed = await createRunLifecycleTestbed(TestRedisPrefix.RunInactivityFire);
  });

  afterAll(async () => {
    await testbed.module.close();
  });

  it('starts the next attempt as a proactive run once the silence is long enough', async () => {
    const seeded = await silentAndDue();

    const fired = await fire(seeded);

    const { latest } = await readLifecycle(testbed, seeded);
    const job = await testbed.queues.get(executeProactiveRunJob.queue).getJob(String(latest?.id));
    expect(fired).toEqual({ outcome: InactivityFireOutcome.Started, run: expect.anything() });
    expect(latest).toMatchObject({
      trigger: RunTrigger.Inactivity,
      triggerNodeId: INACTIVITY_NODE_ID,
      triggerInput: { attempt: 1, silentMinutes: TEST_SILENT_MINUTES },
      status: RunStatus.Queued,
    });
    expect(job?.name).toBe(executeProactiveRunJob.name);

    await execute(seeded, latest?.id);
    expect(await timerOf(seeded)).toMatchObject({ attempt: 1 });
  });

  it('leaves a timer that is not due yet alone', async () => {
    const seeded = await answered();

    expect(await fire(seeded)).toEqual({ outcome: InactivityFireOutcome.Stale, run: null });

    expect(await timerOf(seeded)).not.toBeNull();
  });

  it('keeps the timer while a customer message still waits for its run', async () => {
    const seeded = await silentAndDue();
    await addConversationMessage(testbed, seeded, MessageAuthor.Customer);

    expect(await fire(seeded)).toEqual({ outcome: InactivityFireOutcome.Busy, run: null });

    expect(await timerOf(seeded)).not.toBeNull();
  });

  it.each([
    [
      InactivityFireOutcome.CustomerWrote,
      (seeded: LiveConversation) => recordCustomerMessageAt(testbed, seeded, testbed.clock.now()),
    ],
    [
      InactivityFireOutcome.NotActive,
      (seeded: LiveConversation) => markConversationWaiting(testbed, seeded),
    ],
    [
      InactivityFireOutcome.Escalated,
      async (seeded: LiveConversation) => {
        await markConversationWaiting(testbed, seeded);
        await handConversationBack(testbed, seeded);
      },
    ],
    [
      InactivityFireOutcome.AgentUnavailable,
      (seeded: LiveConversation) => changeAgent(testbed, seeded, AgentChange.PauseWithAwayMessage),
    ],
    [
      InactivityFireOutcome.TriggerRemoved,
      (seeded: LiveConversation) =>
        republish(
          testbed,
          seeded,
          stepFlow(
            [agentNode(FIRST_STEP_ID, FIRST_STEP_KEY)],
            [flowEdge(TEST_NODE_ID, FIRST_STEP_ID)],
          ),
        ),
    ],
  ])('drops the timer without a run when it finds %s', async (outcome, change) => {
    const seeded = await silentAndDue();
    await change(seeded);

    expect(await fire(seeded)).toEqual({ outcome, run: null });

    expect(await timerOf(seeded)).toBeNull();
    expect((await readLifecycle(testbed, seeded)).latest?.trigger).toBe(RunTrigger.Message);
  });
});
