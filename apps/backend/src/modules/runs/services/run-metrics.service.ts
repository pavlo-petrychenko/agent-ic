import { Injectable } from '@nestjs/common';
import { Counter, Histogram } from 'prom-client';
import type { InactivityFireOutcome } from '@/modules/runs/constants/inactivity.constants';
import {
  INACTIVITY_LAG_BUCKETS_SECONDS,
  RUN_DURATION_BUCKETS_SECONDS,
  RUN_QUEUE_WAIT_BUCKETS_SECONDS,
  RUN_STEP_DURATION_BUCKETS_SECONDS,
  RunMetricHelp,
  RunMetricLabel,
  RunMetricName,
} from '@/modules/runs/constants/run-metrics.constants';
import { secondsBetween } from '@/modules/runs/helpers/run-metrics.helpers';
import type { FinishedRunStepStatus } from '@/modules/runs/typedefs/run-step.typedefs';
import type { FinishedRunStatus, Run } from '@/modules/runs/typedefs/run.typedefs';
import {
  activeExemplarLabels,
  observeWithExemplar,
} from '@/platform/observability/helpers/exemplar.helpers';
import { MetricsService } from '@/platform/observability/services/metrics.service';

@Injectable()
export class RunMetricsService {
  private readonly created: Counter<RunMetricLabel>;
  private readonly finished: Counter<RunMetricLabel>;
  private readonly duration: Histogram<RunMetricLabel>;
  private readonly queueWait: Histogram<RunMetricLabel>;
  private readonly steps: Counter<RunMetricLabel>;
  private readonly stepDuration: Histogram<RunMetricLabel>;
  private readonly inactivityFires: Counter<RunMetricLabel>;
  private readonly inactivityLag: Histogram<RunMetricLabel>;

  constructor(metrics: MetricsService) {
    const registers = [metrics.registry];
    const finishLabels = [RunMetricLabel.Mode, RunMetricLabel.Status];
    const stepLabels = [RunMetricLabel.NodeType, RunMetricLabel.Status];
    this.created = new Counter({
      name: RunMetricName.Created,
      help: RunMetricHelp.Created,
      labelNames: [RunMetricLabel.Trigger, RunMetricLabel.Mode],
      registers,
    });
    this.finished = new Counter({
      name: RunMetricName.Finished,
      help: RunMetricHelp.Finished,
      labelNames: finishLabels,
      registers,
    });
    this.duration = new Histogram({
      name: RunMetricName.Duration,
      help: RunMetricHelp.Duration,
      labelNames: finishLabels,
      buckets: [...RUN_DURATION_BUCKETS_SECONDS],
      enableExemplars: true,
      registers,
    });
    this.queueWait = new Histogram({
      name: RunMetricName.QueueWait,
      help: RunMetricHelp.QueueWait,
      labelNames: [RunMetricLabel.Mode],
      buckets: [...RUN_QUEUE_WAIT_BUCKETS_SECONDS],
      enableExemplars: true,
      registers,
    });
    this.steps = new Counter({
      name: RunMetricName.Steps,
      help: RunMetricHelp.Steps,
      labelNames: stepLabels,
      registers,
    });
    this.stepDuration = new Histogram({
      name: RunMetricName.StepDuration,
      help: RunMetricHelp.StepDuration,
      labelNames: stepLabels,
      buckets: [...RUN_STEP_DURATION_BUCKETS_SECONDS],
      enableExemplars: true,
      registers,
    });
    this.inactivityFires = new Counter({
      name: RunMetricName.InactivityFires,
      help: RunMetricHelp.InactivityFires,
      labelNames: [RunMetricLabel.Outcome],
      registers,
    });
    this.inactivityLag = new Histogram({
      name: RunMetricName.InactivityLag,
      help: RunMetricHelp.InactivityLag,
      buckets: [...INACTIVITY_LAG_BUCKETS_SECONDS],
      registers,
    });
  }

  inactivityFired(outcome: InactivityFireOutcome, dueAt: Date | null, firedAt: Date): void {
    this.inactivityFires.inc({ [RunMetricLabel.Outcome]: outcome });
    if (dueAt !== null) {
      this.inactivityLag.observe(secondsBetween(dueAt, firedAt));
    }
  }

  runCreated(run: Pick<Run, 'trigger' | 'mode'>): void {
    this.created.inc({ [RunMetricLabel.Trigger]: run.trigger, [RunMetricLabel.Mode]: run.mode });
  }

  runStarted(run: Pick<Run, 'mode' | 'createdAt'>, startedAt: Date): void {
    observeWithExemplar(
      this.queueWait,
      { [RunMetricLabel.Mode]: run.mode },
      secondsBetween(run.createdAt, startedAt),
      activeExemplarLabels(),
    );
  }

  runFinished(
    run: Pick<Run, 'mode'>,
    status: FinishedRunStatus,
    startedAt: Date | null,
    finishedAt: Date,
  ): void {
    const labels = { [RunMetricLabel.Mode]: run.mode, [RunMetricLabel.Status]: status };
    this.finished.inc(labels);
    if (startedAt !== null) {
      observeWithExemplar(
        this.duration,
        labels,
        secondsBetween(startedAt, finishedAt),
        activeExemplarLabels(),
      );
    }
  }

  stepFinished(
    nodeType: string,
    status: FinishedRunStepStatus,
    startedAt: Date,
    finishedAt: Date,
  ): void {
    const labels = { [RunMetricLabel.NodeType]: nodeType, [RunMetricLabel.Status]: status };
    this.steps.inc(labels);
    observeWithExemplar(
      this.stepDuration,
      labels,
      secondsBetween(startedAt, finishedAt),
      activeExemplarLabels(),
    );
  }
}
