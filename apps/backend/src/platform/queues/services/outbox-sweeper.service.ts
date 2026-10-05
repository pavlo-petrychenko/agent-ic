import { Injectable, Logger } from '@nestjs/common';
import { ClockService } from '@/platform/clock/services/clock.service';
import {
  OUTBOX_SWEEP_BATCH_SIZE,
  OutboxLogMessage,
} from '@/platform/queues/constants/outbox.constants';
import { outboxJobOptions, outboxSweepCutoff } from '@/platform/queues/helpers/outbox.helpers';
import { OutboxRepository } from '@/platform/queues/repositories/outbox.repository';
import { QueuesService } from '@/platform/queues/services/queues.service';
import type { OutboxMessage } from '@/platform/queues/typedefs/outbox.typedefs';

@Injectable()
export class OutboxSweeperService {
  private readonly logger = new Logger(OutboxSweeperService.name);

  constructor(
    private readonly outbox: OutboxRepository,
    private readonly queues: QueuesService,
    private readonly clock: ClockService,
  ) {}

  async sweep(): Promise<number> {
    const sent = await this.outbox.takeDue(
      outboxSweepCutoff(this.clock.now()),
      OUTBOX_SWEEP_BATCH_SIZE,
      (message) => this.send(message),
    );
    if (sent > 0) {
      this.logger.log({ msg: OutboxLogMessage.Swept, count: sent });
    }
    return sent;
  }

  private async send(message: OutboxMessage): Promise<void> {
    await this.queues
      .get(message.queue)
      .add(message.name, message.envelope, outboxJobOptions(message.id));
  }
}
