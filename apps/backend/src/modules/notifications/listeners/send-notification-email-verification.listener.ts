import { Injectable } from '@nestjs/common';
import type { NotificationEmailVerificationInput } from '@/modules/notifications/events/notification-email-verification-requested.event';
import { sendNotificationEmailVerificationJob } from '@/modules/notifications/jobs/send-notification-email-verification.job';
import { SendNotificationEmailVerificationUseCase } from '@/modules/notifications/use-cases/send-notification-email-verification.use-case';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { OnDomainEvent } from '@/platform/domain-events/decorators/on-domain-event.decorator';
import type { JobHandler } from '@/platform/queues/typedefs/job.typedefs';

@Injectable()
@OnDomainEvent(sendNotificationEmailVerificationJob)
export class SendNotificationEmailVerificationListener implements JobHandler<NotificationEmailVerificationInput> {
  constructor(
    private readonly sendNotificationEmailVerification: SendNotificationEmailVerificationUseCase,
  ) {}

  handle(ctx: UseCaseCtx, data: NotificationEmailVerificationInput): Promise<void> {
    return this.sendNotificationEmailVerification.execute(ctx, data);
  }
}
