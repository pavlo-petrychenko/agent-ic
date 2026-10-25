import { Injectable } from '@nestjs/common';
import { Counter, Gauge } from 'prom-client';
import { MILLISECONDS_PER_SECOND } from '@/platform/clock/constants/time.constants';
import { ClockService } from '@/platform/clock/services/clock.service';
import { MetricsService } from '@/platform/observability/services/metrics.service';
import {
  NO_OUTBOX_AGE_SECONDS,
  OutboxMetricHelp,
  OutboxMetricName,
} from '@/platform/queues/constants/outbox.constants';
import { OutboxRepository } from '@/platform/queues/repositories/outbox.repository';

@Injectable()
export class OutboxMetricsService {
  private readonly swept: Counter;

  constructor(
    metrics: MetricsService,
    private readonly outbox: OutboxRepository,
    private readonly clock: ClockService,
  ) {
    const registers = [metrics.registry];
    this.swept = new Counter({
      name: OutboxMetricName.SweptMessages,
      help: OutboxMetricHelp.SweptMessages,
      registers,
    });
    const pending = new Gauge({
      name: OutboxMetricName.PendingMessages,
      help: OutboxMetricHelp.PendingMessages,
      registers,
      collect: async () => {
        const backlog = await this.outbox.backlog();
        pending.set(backlog.pending);
      },
    });
    const oldestAge = new Gauge({
      name: OutboxMetricName.OldestMessageAge,
      help: OutboxMetricHelp.OldestMessageAge,
      registers,
      collect: async () => {
        const backlog = await this.outbox.backlog();
        oldestAge.set(this.ageSeconds(backlog.oldestCreatedAt));
      },
    });
  }

  sweptMessages(count: number): void {
    this.swept.inc(count);
  }

  private ageSeconds(createdAt: Date | null): number {
    if (createdAt === null) {
      return NO_OUTBOX_AGE_SECONDS;
    }
    const ageMs = this.clock.now().getTime() - createdAt.getTime();
    return Math.max(NO_OUTBOX_AGE_SECONDS, ageMs / MILLISECONDS_PER_SECOND);
  }
}
