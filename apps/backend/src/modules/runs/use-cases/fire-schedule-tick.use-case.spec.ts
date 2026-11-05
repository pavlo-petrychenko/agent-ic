import { nextTicks } from '@agent-ic/flow';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { RunTrigger } from '@/modules/runs/constants/run.constants';
import {
  SCHEDULED_FOR_INPUT_KEY,
  ScheduleTickOutcome,
} from '@/modules/runs/constants/schedule-tick.constants';
import { scheduleTickJobId } from '@/modules/runs/helpers/schedule-tick.helpers';
import { fireScheduleTickJob } from '@/modules/runs/jobs/fire-schedule-tick.job';
import type { FireScheduleTickJobData } from '@/modules/runs/typedefs/schedule-tick.typedefs';
import { FireScheduleTickUseCase } from '@/modules/runs/use-cases/fire-schedule-tick.use-case';
import { SweepScheduleTriggersUseCase } from '@/modules/runs/use-cases/sweep-schedule-triggers.use-case';
import { RETRYABLE_ATTEMPT } from '@test/support/constants/async-jobs.constants';
import { AgentChange } from '@test/support/constants/runs-testing.constants';
import {
  FIRST_STEP_ID,
  FIRST_STEP_KEY,
  SCHEDULE_NODE_ID,
} from '@test/support/constants/runs-testing.constants';
import { TestRedisPrefix } from '@test/support/constants/test-infrastructure.constants';
import { systemCtx } from '@test/support/fixtures/identity.fixture';
import {
  agentNode,
  flowEdge,
  scheduleTriggerNode,
  stepFlow,
} from '@test/support/fixtures/runs.fixture';
import {
  changeAgent,
  createRunLifecycleTestbed,
  markCustomerSilentSince,
  readLifecycle,
  receiveMessage,
  seedLiveConversation,
} from '@test/support/helpers/runs-testing.helpers';
import type {
  LiveConversation,
  RunLifecycleTestbed,
} from '@test/support/typedefs/runs-testing.typedefs';

const TICK_LAG_MS = 5_000;
const MINUTE_MS = 60_000;

const schedule = scheduleTriggerNode();
const scheduledFlow = stepFlow(
  [schedule, agentNode(FIRST_STEP_ID, FIRST_STEP_KEY)],
  [flowEdge(SCHEDULE_NODE_ID, FIRST_STEP_ID)],
);

describe('FireScheduleTickUseCase', () => {
  let testbed: RunLifecycleTestbed;
  let fireTick: FireScheduleTickUseCase;
  let sweep: SweepScheduleTriggersUseCase;

  beforeAll(async () => {
    testbed = await createRunLifecycleTestbed(TestRedisPrefix.ScheduleTick);
    fireTick = testbed.module.get(FireScheduleTickUseCase);
    sweep = testbed.module.get(SweepScheduleTriggersUseCase);
  });

  afterAll(async () => {
    await testbed.module.close();
  });

  const silentConversation = async (): Promise<LiveConversation> => {
    const seeded = await seedLiveConversation(testbed, scheduledFlow);
    const { run } = await receiveMessage(testbed, seeded);
    await testbed.executeRun.execute(seeded.ctx, { runId: String(run?.id) }, RETRYABLE_ATTEMPT);
    await markCustomerSilentSince(testbed, seeded, testbed.clock.now());
    return seeded;
  };

  const nextTick = (): Date => {
    const [tick] = nextTicks(schedule.config.schedule, testbed.clock.now(), 1);
    if (tick === undefined) {
      throw new TypeError(SCHEDULE_NODE_ID);
    }
    testbed.clock.advanceBy(tick.getTime() - testbed.clock.now().getTime() + TICK_LAG_MS);
    return tick;
  };

  const tickData = (
    { conversation, versionId }: LiveConversation,
    tick: Date,
    missed = false,
  ): FireScheduleTickJobData => ({
    agentId: conversation.agentId,
    versionId,
    nodeId: SCHEDULE_NODE_ID,
    scheduledFor: tick.toISOString(),
    missed,
  });

  it('starts a schedule run in each matching conversation once per tick', async () => {
    const seeded = await silentConversation();
    const tick = nextTick();

    const fired = await fireTick.execute(seeded.ctx, tickData(seeded, tick));
    const again = await fireTick.execute(seeded.ctx, tickData(seeded, tick));

    const { latest } = await readLifecycle(testbed, seeded);
    expect(fired).toEqual({ outcome: ScheduleTickOutcome.Fired, matched: 1, started: 1 });
    expect(again).toEqual({ outcome: null, matched: 0, started: 0 });
    expect(latest).toMatchObject({
      trigger: RunTrigger.Schedule,
      triggerNodeId: SCHEDULE_NODE_ID,
      triggerInput: { [SCHEDULED_FOR_INPUT_KEY]: tick.toISOString() },
    });
  });

  it('skips the tick of a paused agent', async () => {
    const seeded = await silentConversation();
    await changeAgent(testbed, seeded, AgentChange.PauseWithAwayMessage);

    const skipped = await fireTick.execute(seeded.ctx, tickData(seeded, nextTick()));

    expect(skipped.outcome).toBe(ScheduleTickOutcome.SkippedPaused);
  });

  it('skips a tick the live trigger no longer schedules', async () => {
    const seeded = await silentConversation();
    const moved = new Date(nextTick().getTime() + MINUTE_MS);

    const skipped = await fireTick.execute(seeded.ctx, tickData(seeded, moved));

    expect(skipped.outcome).toBe(ScheduleTickOutcome.SkippedChanged);
  });

  it('records a missed tick without contacting anyone', async () => {
    const seeded = await silentConversation();

    const skipped = await fireTick.execute(seeded.ctx, tickData(seeded, nextTick(), true));

    expect(skipped).toEqual({ outcome: ScheduleTickOutcome.SkippedMissed, matched: 0, started: 0 });
  });

  it('queues one tick job per due trigger from the sweep', async () => {
    const seeded = await silentConversation();
    const tick = nextTick();

    await sweep.execute(systemCtx());

    const jobId = scheduleTickJobId(seeded.conversation.agentId, SCHEDULE_NODE_ID, tick);
    const job = await testbed.queues.get(fireScheduleTickJob.queue).getJob(jobId);
    expect(job?.data).toMatchObject({
      workspaceId: seeded.conversation.workspaceId,
      data: tickData(seeded, tick),
    });
  });
});
