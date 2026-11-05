import { Injectable } from '@nestjs/common';
import { Counter, Histogram } from 'prom-client';
import {
  SCHEDULE_TICK_LAG_BUCKETS_SECONDS,
  ScheduleMetricHelp,
  ScheduleMetricLabel,
  ScheduleMetricName,
} from '@/modules/runs/constants/schedule-tick.constants';
import type {
  ScheduleMatchOutcome,
  ScheduleTickOutcome,
} from '@/modules/runs/constants/schedule-tick.constants';
import { secondsBetween } from '@/modules/runs/helpers/run-metrics.helpers';
import { MetricsService } from '@/platform/observability/services/metrics.service';

@Injectable()
export class ScheduleMetricsService {
  private readonly sweeps: Counter;
  private readonly ticks: Counter<ScheduleMetricLabel>;
  private readonly lag: Histogram;
  private readonly missed: Counter;
  private readonly matches: Counter<ScheduleMetricLabel>;

  constructor(metrics: MetricsService) {
    const registers = [metrics.registry];
    this.sweeps = new Counter({
      name: ScheduleMetricName.Sweeps,
      help: ScheduleMetricHelp.Sweeps,
      registers,
    });
    this.ticks = new Counter({
      name: ScheduleMetricName.Ticks,
      help: ScheduleMetricHelp.Ticks,
      labelNames: [ScheduleMetricLabel.Outcome],
      registers,
    });
    this.lag = new Histogram({
      name: ScheduleMetricName.TickLag,
      help: ScheduleMetricHelp.TickLag,
      buckets: [...SCHEDULE_TICK_LAG_BUCKETS_SECONDS],
      registers,
    });
    this.missed = new Counter({
      name: ScheduleMetricName.TicksMissed,
      help: ScheduleMetricHelp.TicksMissed,
      registers,
    });
    this.matches = new Counter({
      name: ScheduleMetricName.Matches,
      help: ScheduleMetricHelp.Matches,
      labelNames: [ScheduleMetricLabel.Outcome],
      registers,
    });
  }

  swept(): void {
    this.sweeps.inc();
  }

  tickHandled(outcome: ScheduleTickOutcome, scheduledFor: Date, handledAt: Date): void {
    this.ticks.inc({ [ScheduleMetricLabel.Outcome]: outcome });
    this.lag.observe(secondsBetween(scheduledFor, handledAt));
  }

  tickMissed(): void {
    this.missed.inc();
  }

  matched(outcome: ScheduleMatchOutcome, count: number): void {
    if (count > 0) {
      this.matches.inc({ [ScheduleMetricLabel.Outcome]: outcome }, count);
    }
  }
}
