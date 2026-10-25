import { Injectable } from '@nestjs/common';
import { Counter, Gauge, Histogram } from 'prom-client';
import { MILLISECONDS_PER_SECOND } from '@/platform/clock/constants/time.constants';
import { ClockService } from '@/platform/clock/services/clock.service';
import {
  activeExemplarLabels,
  observeWithExemplar,
} from '@/platform/observability/helpers/exemplar.helpers';
import { MetricsService } from '@/platform/observability/services/metrics.service';
import {
  FIRST_ATTEMPT,
  JOB_DURATION_BUCKETS_SECONDS,
  JOB_WAIT_BUCKETS_SECONDS,
  JobMetricHelp,
  JobMetricLabel,
  JobMetricName,
  JobOutcome,
  NO_WAIT_MS,
} from '@/platform/queues/constants/job-metrics.constants';
import type { QueueName } from '@/platform/queues/constants/queue.constants';
import type { TrackedJob } from '@/platform/queues/typedefs/job.typedefs';

@Injectable()
export class JobMetricsService {
  private readonly processed: Counter<JobMetricLabel>;
  private readonly duration: Histogram<JobMetricLabel>;
  private readonly wait: Histogram<JobMetricLabel>;
  private readonly active: Gauge<JobMetricLabel>;

  constructor(
    metrics: MetricsService,
    private readonly clock: ClockService,
  ) {
    const registers = [metrics.registry];
    const jobLabels = [JobMetricLabel.Queue, JobMetricLabel.Job];
    const outcomeLabels = [...jobLabels, JobMetricLabel.Outcome];
    this.processed = new Counter({
      name: JobMetricName.Processed,
      help: JobMetricHelp.Processed,
      labelNames: outcomeLabels,
      registers,
    });
    this.duration = new Histogram({
      name: JobMetricName.Duration,
      help: JobMetricHelp.Duration,
      labelNames: outcomeLabels,
      buckets: [...JOB_DURATION_BUCKETS_SECONDS],
      enableExemplars: true,
      registers,
    });
    this.wait = new Histogram({
      name: JobMetricName.Wait,
      help: JobMetricHelp.Wait,
      labelNames: jobLabels,
      buckets: [...JOB_WAIT_BUCKETS_SECONDS],
      enableExemplars: true,
      registers,
    });
    this.active = new Gauge({
      name: JobMetricName.Active,
      help: JobMetricHelp.Active,
      labelNames: jobLabels,
      registers,
    });
  }

  async track<TResult>(
    queue: QueueName,
    job: TrackedJob,
    work: () => Promise<TResult>,
  ): Promise<TResult> {
    const jobLabels = { [JobMetricLabel.Queue]: queue, [JobMetricLabel.Job]: job.name };
    const startedAt = this.clock.now().getTime();
    this.observeWait(jobLabels, job, startedAt);
    this.active.inc(jobLabels);
    let outcome = JobOutcome.Failed;
    try {
      const result = await work();
      outcome = JobOutcome.Succeeded;
      return result;
    } finally {
      this.active.dec(jobLabels);
      const labels = { ...jobLabels, [JobMetricLabel.Outcome]: outcome };
      this.processed.inc(labels);
      observeWithExemplar(
        this.duration,
        labels,
        (this.clock.now().getTime() - startedAt) / MILLISECONDS_PER_SECOND,
        activeExemplarLabels(),
      );
    }
  }

  private observeWait(
    labels: Record<JobMetricLabel.Queue | JobMetricLabel.Job, string>,
    job: TrackedJob,
    startedAt: number,
  ): void {
    if (job.attemptsMade !== FIRST_ATTEMPT) {
      return;
    }
    const readyAt = job.timestamp + (job.opts.delay ?? NO_WAIT_MS);
    const waitedMs = Math.max(NO_WAIT_MS, startedAt - readyAt);
    observeWithExemplar(
      this.wait,
      labels,
      waitedMs / MILLISECONDS_PER_SECOND,
      activeExemplarLabels(),
    );
  }
}
