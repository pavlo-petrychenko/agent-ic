import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { fireInactivityTimerJob } from '@/modules/runs/jobs/fire-inactivity-timer.job';
import { InactivitySweepRepository } from '@/modules/runs/repositories/inactivity-sweep.repository';
import type { NewInactivityTimer } from '@/modules/runs/typedefs/inactivity-timer.typedefs';
import { SweepInactivityTimersUseCase } from '@/modules/runs/use-cases/sweep-inactivity-timers.use-case';
import {
  MILLISECONDS_PER_SECOND,
  SECONDS_PER_HOUR,
  SECONDS_PER_MINUTE,
} from '@/platform/clock/constants/time.constants';
import { QueuesService } from '@/platform/queues/services/queues.service';
import {
  INACTIVITY_SWEEP_TEST_START,
  RUNS_TEST_START,
} from '@test/support/constants/runs-testing.constants';
import { TestRedisPrefix } from '@test/support/constants/test-infrastructure.constants';
import { systemCtx } from '@test/support/fixtures/identity.fixture';
import { newInactivityTimer } from '@test/support/fixtures/runs.fixture';
import { createRunsTestbed, seedRun } from '@test/support/helpers/runs-testing.helpers';
import type { RunExecutionTestbed } from '@test/support/typedefs/runs-testing.typedefs';

const MINUTE_MS = SECONDS_PER_MINUTE * MILLISECONDS_PER_SECOND;
const LEASE_MINUTES = 5;
const NO_CAP = 10;

describe('InactivitySweepRepository', () => {
  let testbed: RunExecutionTestbed;
  let sweep: InactivitySweepRepository;

  const at = (minutes: number): Date =>
    new Date(testbed.clock.now().getTime() + minutes * MINUTE_MS);

  const armIn = async (
    workspaceId: string,
    overrides: Partial<NewInactivityTimer>,
  ): Promise<string> => {
    const run = await seedRun(testbed, workspaceId);
    const timer = newInactivityTimer(testbed, run, overrides);
    await testbed.tenants.run(workspaceId, () => testbed.timers.arm(timer));
    return timer.id;
  };

  const claimIds = async (limit = NO_CAP, perWorkspace = NO_CAP): Promise<string[]> => {
    const claimed = await sweep.claimDue({
      now: testbed.clock.now(),
      leaseUntil: at(LEASE_MINUTES),
      limit,
      perWorkspace,
    });
    return claimed.map(({ id }) => id).sort();
  };

  beforeAll(async () => {
    testbed = await createRunsTestbed(TestRedisPrefix.RunInactivitySweep);
    testbed.clock.advanceBy(INACTIVITY_SWEEP_TEST_START.getTime() - RUNS_TEST_START.getTime());
    sweep = testbed.module.get(InactivitySweepRepository);
  });

  beforeEach(() => {
    testbed.clock.advanceBy(-SECONDS_PER_HOUR * MILLISECONDS_PER_SECOND);
  });

  afterAll(async () => {
    await testbed.module.close();
  });

  it('leases the due timers of every workspace and leaves the rest', async () => {
    const first = testbed.ids.generate();
    const second = testbed.ids.generate();
    const early = await armIn(first, { dueAt: at(-2) });
    const late = await armIn(second, { dueAt: at(-1) });
    await armIn(first, { dueAt: at(LEASE_MINUTES) });
    await armIn(second, { dueAt: null });

    expect(await claimIds()).toEqual([early, late].sort());

    const stored = await testbed.tenants.run(first, () => testbed.timers.findById(first, early));
    expect(stored).toMatchObject({ leaseUntil: at(LEASE_MINUTES), updatedAt: testbed.clock.now() });
  });

  it('does not claim a leased timer again until its lease ends', async () => {
    const id = await armIn(testbed.ids.generate(), { dueAt: at(-1) });

    expect(await claimIds()).toEqual([id]);
    expect(await claimIds()).toEqual([]);
    testbed.clock.advanceBy(LEASE_MINUTES * MINUTE_MS);
    expect(await claimIds()).toEqual([id]);
  });

  it('takes the oldest timers first, up to the cap per workspace and per sweep', async () => {
    const busy = testbed.ids.generate();
    const quiet = testbed.ids.generate();
    const oldest = await armIn(busy, { dueAt: at(-5) });
    const older = await armIn(busy, { dueAt: at(-4) });
    await armIn(busy, { dueAt: at(-3) });
    const quietOldest = await armIn(quiet, { dueAt: at(-2) });
    await armIn(quiet, { dueAt: at(-1) });

    expect(await claimIds(3, 2)).toEqual([oldest, older, quietOldest].sort());
  });

  it('queues one fire job per claimed timer in the timer workspace', async () => {
    const workspaceId = testbed.ids.generate();
    const id = await armIn(workspaceId, { dueAt: at(-1) });

    const claimed = await testbed.module.get(SweepInactivityTimersUseCase).execute(systemCtx());

    const jobs = await testbed.module
      .get(QueuesService)
      .get(fireInactivityTimerJob.queue)
      .getJobs();
    const queued = jobs.filter((job) => job.data.data['timerId'] === id);
    expect(claimed).toBe(1);
    expect(queued.map((job) => [job.name, job.data.workspaceId])).toEqual([
      [fireInactivityTimerJob.name, workspaceId],
    ]);
    expect(await claimIds()).toEqual([]);
  });
});
