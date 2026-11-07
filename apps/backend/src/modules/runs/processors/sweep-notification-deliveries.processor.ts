import { Injectable } from '@nestjs/common';
import {
  sweepNotificationDeliveriesJob,
  sweepNotificationDeliveriesSchedule,
} from '@/modules/runs/jobs/sweep-notification-deliveries.job';
import type { SweepNotificationDeliveriesInput } from '@/modules/runs/typedefs/notification-delivery.typedefs';
import { SweepNotificationDeliveriesUseCase } from '@/modules/runs/use-cases/sweep-notification-deliveries.use-case';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { ProcessJob } from '@/platform/queues/decorators/process-job.decorator';
import { ScheduleJob } from '@/platform/queues/decorators/schedule-job.decorator';
import type { JobHandler } from '@/platform/queues/typedefs/job.typedefs';

@Injectable()
@ProcessJob(sweepNotificationDeliveriesJob)
@ScheduleJob(sweepNotificationDeliveriesSchedule)
export class SweepNotificationDeliveriesProcessor implements JobHandler<SweepNotificationDeliveriesInput> {
  constructor(private readonly sweep: SweepNotificationDeliveriesUseCase) {}

  async handle(ctx: UseCaseCtx): Promise<void> {
    await this.sweep.execute(ctx);
  }
}
