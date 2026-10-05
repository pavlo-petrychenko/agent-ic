import { Injectable } from '@nestjs/common';
import { ProcessJob } from '@/platform/queues/decorators/process-job.decorator';
import { ScheduleJob } from '@/platform/queues/decorators/schedule-job.decorator';
import { sweepOutboxJob, sweepOutboxSchedule } from '@/platform/queues/jobs/sweep-outbox.job';
import { OutboxSweeperService } from '@/platform/queues/services/outbox-sweeper.service';
import type { JobHandler } from '@/platform/queues/typedefs/job.typedefs';
import type { OutboxSweepInput } from '@/platform/queues/typedefs/outbox.typedefs';

@Injectable()
@ProcessJob(sweepOutboxJob)
@ScheduleJob(sweepOutboxSchedule)
export class SweepOutboxProcessor implements JobHandler<OutboxSweepInput> {
  constructor(private readonly sweeper: OutboxSweeperService) {}

  async handle(): Promise<void> {
    await this.sweeper.sweep();
  }
}
