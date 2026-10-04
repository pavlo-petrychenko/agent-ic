import { Injectable } from '@nestjs/common';
import type { OnModuleInit } from '@nestjs/common';
import { Gauge } from 'prom-client';
import { MILLISECONDS_PER_SECOND } from '@/platform/clock/constants/time.constants';
import { ClockService } from '@/platform/clock/services/clock.service';
import { MetricsService } from '@/platform/observability/metrics/metrics.service';
import {
  NO_WAIT_SECONDS,
  OLDEST_FIRST,
  OLDEST_JOB_INDEX,
  QueueMetricHelp,
  QueueMetricLabel,
  QueueMetricName,
  WAITING_JOB_STATE,
} from '@/platform/queues/metrics/queue-metrics.constants';
import { QueueName } from '@/platform/queues/queue.constants';
import { QueueRegistry } from '@/platform/queues/queue.registry';

@Injectable()
export class QueueMetricsCollector implements OnModuleInit {
  constructor(
    private readonly metrics: MetricsService,
    private readonly queues: QueueRegistry,
    private readonly clock: ClockService,
  ) {}

  onModuleInit(): void {
    this.registerGauge(QueueMetricName.WaitingJobs, QueueMetricHelp.WaitingJobs, (queue) =>
      this.waitingJobs(queue),
    );
    this.registerGauge(
      QueueMetricName.OldestWaitingJobAge,
      QueueMetricHelp.OldestWaitingJobAge,
      (queue) => this.oldestWaitingJobAgeSeconds(queue),
    );
  }

  waitingJobs(queue: QueueName): Promise<number> {
    return this.queues.get(queue).getWaitingCount();
  }

  async oldestWaitingJobAgeSeconds(queue: QueueName): Promise<number> {
    const [oldest] = await this.queues
      .get(queue)
      .getJobs(WAITING_JOB_STATE, OLDEST_JOB_INDEX, OLDEST_JOB_INDEX, OLDEST_FIRST);
    if (oldest === undefined) {
      return NO_WAIT_SECONDS;
    }
    const ageMs = this.clock.now().getTime() - oldest.timestamp;
    return Math.max(NO_WAIT_SECONDS, ageMs / MILLISECONDS_PER_SECOND);
  }

  private registerGauge(
    name: QueueMetricName,
    help: QueueMetricHelp,
    measure: (queue: QueueName) => Promise<number>,
  ): void {
    const gauge: Gauge<QueueMetricLabel> = new Gauge({
      name,
      help,
      labelNames: [QueueMetricLabel.Queue],
      registers: [this.metrics.registry],
      collect: async () => {
        for (const queue of Object.values(QueueName)) {
          gauge.set({ [QueueMetricLabel.Queue]: queue }, await measure(queue));
        }
      },
    });
  }
}
