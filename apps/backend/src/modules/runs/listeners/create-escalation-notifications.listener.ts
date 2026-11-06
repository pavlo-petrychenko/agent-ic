import { Injectable } from '@nestjs/common';
import { createEscalationNotificationsJob } from '@/modules/runs/jobs/create-escalation-notifications.job';
import type { RunEscalatedPayload } from '@/modules/runs/typedefs/run-event.typedefs';
import { CreateEscalationNotificationsUseCase } from '@/modules/runs/use-cases/create-escalation-notifications.use-case';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { OnDomainEvent } from '@/platform/domain-events/decorators/on-domain-event.decorator';
import type { JobHandler } from '@/platform/queues/typedefs/job.typedefs';

@Injectable()
@OnDomainEvent(createEscalationNotificationsJob)
export class CreateEscalationNotificationsListener implements JobHandler<RunEscalatedPayload> {
  constructor(private readonly createNotifications: CreateEscalationNotificationsUseCase) {}

  handle(ctx: UseCaseCtx, data: RunEscalatedPayload): Promise<void> {
    return this.createNotifications.execute(ctx, data);
  }
}
