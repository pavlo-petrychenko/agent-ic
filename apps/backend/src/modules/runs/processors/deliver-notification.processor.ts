import { Injectable } from '@nestjs/common';
import {
  deliverNotificationJob,
  type DeliverNotificationJobData,
} from '@/modules/runs/jobs/deliver-notification.job';
import { DeliverNotificationUseCase } from '@/modules/runs/use-cases/deliver-notification.use-case';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { ProcessJob } from '@/platform/queues/decorators/process-job.decorator';
import type { JobHandler } from '@/platform/queues/typedefs/job.typedefs';

@Injectable()
@ProcessJob(deliverNotificationJob)
export class DeliverNotificationProcessor implements JobHandler<DeliverNotificationJobData> {
  constructor(private readonly deliverNotification: DeliverNotificationUseCase) {}

  handle(ctx: UseCaseCtx, data: DeliverNotificationJobData): Promise<void> {
    return this.deliverNotification.execute(ctx, data);
  }
}
