import { beforeEach, describe, expect, it } from 'vitest';
import { MILLISECONDS_PER_SECOND } from '@/platform/clock/constants/time.constants';
import type { MetricsService } from '@/platform/observability/services/metrics.service';
import {
  JobMetricLabel,
  JobMetricName,
  JobOutcome,
} from '@/platform/queues/constants/job-metrics.constants';
import { QueueName } from '@/platform/queues/constants/queue.constants';
import { JobMetricsService } from '@/platform/queues/services/job-metrics.service';
import type { TrackedJob } from '@/platform/queues/typedefs/job.typedefs';
import { ManualClock } from '@test/support/fakes/manual-clock.fake';
import { createMetricsService, metricValue } from '@test/support/helpers/llm-testing.helpers';

const START = new Date('2026-01-01T00:00:00Z');
const WAIT_MS = 4_000;
const RUN_MS = 1_500;
const JOB_NAME = 'runs.execute';

class JobOutage extends Error {}

const jobWaiting = (waitedMs: number, attemptsMade = 0): TrackedJob => ({
  name: JOB_NAME,
  timestamp: START.getTime() - waitedMs,
  opts: {},
  attemptsMade,
});

const labelsOf = (outcome: JobOutcome): Record<string, string> => ({
  [JobMetricLabel.Queue]: QueueName.RunsReactive,
  [JobMetricLabel.Job]: JOB_NAME,
  [JobMetricLabel.Outcome]: outcome,
});

describe('JobMetricsService', () => {
  let metrics: MetricsService;
  let clock: ManualClock;
  let service: JobMetricsService;

  beforeEach(() => {
    metrics = createMetricsService();
    clock = new ManualClock(START);
    service = new JobMetricsService(metrics, clock);
  });

  it('counts a finished job and times how long it ran', async () => {
    await service.track(QueueName.RunsReactive, jobWaiting(WAIT_MS), () => {
      clock.advanceBy(RUN_MS);
      return Promise.resolve();
    });

    expect(
      await metricValue(metrics, JobMetricName.Processed, labelsOf(JobOutcome.Succeeded)),
    ).toBe(1);
    expect(await metrics.render()).toContain(
      `${JobMetricName.Duration}_sum{role="api",queue="runs-reactive",job_name="${JOB_NAME}",outcome="succeeded"} ${RUN_MS / MILLISECONDS_PER_SECOND}`,
    );
  });

  it('times how long the job waited before its first attempt', async () => {
    await service.track(QueueName.RunsReactive, jobWaiting(WAIT_MS), () => Promise.resolve());

    expect(await metrics.render()).toContain(
      `${JobMetricName.Wait}_sum{role="api",queue="runs-reactive",job_name="${JOB_NAME}"} ${WAIT_MS / MILLISECONDS_PER_SECOND}`,
    );
  });

  it('does not count the delay a job asked for as waiting', async () => {
    const delayed = { ...jobWaiting(WAIT_MS), opts: { delay: WAIT_MS } };

    await service.track(QueueName.RunsReactive, delayed, () => Promise.resolve());

    expect(await metrics.render()).toContain(
      `${JobMetricName.Wait}_sum{role="api",queue="runs-reactive",job_name="${JOB_NAME}"} 0`,
    );
  });

  it('does not count a retry as waiting again', async () => {
    await service.track(QueueName.RunsReactive, jobWaiting(WAIT_MS, 1), () => Promise.resolve());

    expect(await metrics.render()).not.toContain(`${JobMetricName.Wait}_count`);
  });

  it('counts a failed job and still rethrows', async () => {
    const failure = service.track(QueueName.RunsReactive, jobWaiting(WAIT_MS), () =>
      Promise.reject(new JobOutage()),
    );

    await expect(failure).rejects.toBeInstanceOf(JobOutage);
    expect(await metricValue(metrics, JobMetricName.Processed, labelsOf(JobOutcome.Failed))).toBe(
      1,
    );
  });

  it('shows a running job as active until it ends', async () => {
    const active = {
      [JobMetricLabel.Queue]: QueueName.RunsReactive,
      [JobMetricLabel.Job]: JOB_NAME,
    };
    let duringRun: number | null = null;

    await service.track(QueueName.RunsReactive, jobWaiting(WAIT_MS), async () => {
      duringRun = await metricValue(metrics, JobMetricName.Active, active);
    });

    expect(duringRun).toBe(1);
    expect(await metricValue(metrics, JobMetricName.Active, active)).toBe(0);
  });
});
