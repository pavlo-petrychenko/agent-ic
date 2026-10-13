import { Injectable } from '@nestjs/common';
import { sendEmailChangeEmailJob } from '@/modules/notifications/jobs/send-email-change-email.job';
import type { SendEmailChangeEmailInput } from '@/modules/notifications/typedefs/send-email-change-email.typedefs';
import { SendEmailChangeEmailUseCase } from '@/modules/notifications/use-cases/send-email-change-email.use-case';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { OnDomainEvent } from '@/platform/domain-events/decorators/on-domain-event.decorator';
import type { JobHandler } from '@/platform/queues/typedefs/job.typedefs';

@Injectable()
@OnDomainEvent(sendEmailChangeEmailJob)
export class SendEmailChangeEmailListener implements JobHandler<SendEmailChangeEmailInput> {
  constructor(private readonly sendEmailChangeEmail: SendEmailChangeEmailUseCase) {}

  handle(ctx: UseCaseCtx, data: SendEmailChangeEmailInput): Promise<void> {
    return this.sendEmailChangeEmail.execute(ctx, data);
  }
}
