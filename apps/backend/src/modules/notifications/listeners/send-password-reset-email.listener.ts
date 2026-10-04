import { Injectable } from '@nestjs/common';
import { sendPasswordResetEmailJob } from '@/modules/notifications/jobs/send-password-reset-email.job';
import type { SendPasswordResetEmailInput } from '@/modules/notifications/typedefs/send-password-reset-email.typedefs';
import { SendPasswordResetEmailUseCase } from '@/modules/notifications/use-cases/send-password-reset-email.use-case';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { OnDomainEvent } from '@/platform/domain-events/decorators/on-domain-event.decorator';
import type { JobHandler } from '@/platform/queues/typedefs/job.typedefs';

@Injectable()
@OnDomainEvent(sendPasswordResetEmailJob)
export class SendPasswordResetEmailListener implements JobHandler<SendPasswordResetEmailInput> {
  constructor(private readonly sendPasswordResetEmail: SendPasswordResetEmailUseCase) {}

  handle(ctx: UseCaseCtx, data: SendPasswordResetEmailInput): Promise<void> {
    return this.sendPasswordResetEmail.execute(ctx, data);
  }
}
