import { Injectable, Logger } from '@nestjs/common';
import { context } from '@opentelemetry/api';
import { ClockService } from '@/platform/clock/services/clock.service';
import {
  OUTBOX_SWEEP_BATCH_SIZE,
  OutboxLogMessage,
} from '@/platform/queues/constants/outbox.constants';
import { outboxJobOptions, outboxSweepCutoff } from '@/platform/queues/helpers/outbox.helpers';
import { traceContextOf } from '@/platform/queues/helpers/queue-telemetry.helpers';
import { OutboxRepository } from '@/platform/queues/repositories/outbox.repository';
import { jobTraceContextSchema } from '@/platform/queues/schemas/job-envelope.schema';
import { OutboxMetricsService } from '@/platform/queues/services/outbox-metrics.service';
import { QueuesService } from '@/platform/queues/services/queues.service';
import type { OutboxMessage } from '@/platform/queues/typedefs/outbox.typedefs';

@Injectable()
export class OutboxSweeperService {
  private readonly logger = new Logger(OutboxSweeperService.name);

  constructor(
    private readonly outbox: OutboxRepository,
    private readonly queues: QueuesService,
    private readonly clock: ClockService,
    private readonly metrics: OutboxMetricsService,
  ) {}

  async sweep(): Promise<number> {
    const sent = await this.outbox.takeDue(
      outboxSweepCutoff(this.clock.now()),
      OUTBOX_SWEEP_BATCH_SIZE,
      (message) => this.send(message),
    );
    if (sent > 0) {
      this.metrics.sweptMessages(sent);
      this.logger.log({ msg: OutboxLogMessage.Swept, count: sent });
    }
    return sent;
  }

  private async send(message: OutboxMessage): Promise<void> {
    const parent = traceContextOf(jobTraceContextSchema.parse(message.envelope.traceContext));
    await context.with(parent, () =>
      this.queues
        .get(message.queue)
        .add(message.name, message.envelope, outboxJobOptions(message.id)),
    );
  }
}
