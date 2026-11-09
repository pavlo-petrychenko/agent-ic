import { Injectable } from '@nestjs/common';
import { DELIVERY_SWEEP_LIMIT, NotificationDeliverySweepRepository } from '@/modules/notifications';
import { deliverNotificationJob } from '@/modules/runs/jobs/deliver-notification.job';
import { ClockService } from '@/platform/clock/services/clock.service';
import { requireSystemActor } from '@/platform/context/helpers/use-case-ctx.helpers';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { JobsService } from '@/platform/queues/services/jobs.service';

@Injectable()
export class SweepNotificationDeliveriesUseCase {
  constructor(
    private readonly deliveries: NotificationDeliverySweepRepository,
    private readonly jobs: JobsService,
    private readonly clock: ClockService,
  ) {}

  async execute(ctx: UseCaseCtx): Promise<number> {
    requireSystemActor(ctx);
    const due = await this.deliveries.findDue(this.clock.now(), DELIVERY_SWEEP_LIMIT);
    for (const delivery of due) {
      await this.jobs.enqueue(
        { ...ctx, workspaceId: delivery.workspaceId },
        deliverNotificationJob,
        {
          notificationId: delivery.notificationId,
          channel: delivery.channel,
        },
      );
    }
    return due.length;
  }
}
