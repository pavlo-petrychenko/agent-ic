import { Injectable } from '@nestjs/common';
import { sendConfirmationEmailJob } from '@/modules/notifications/jobs/send-confirmation-email.job';
import type { SendConfirmationEmailInput } from '@/modules/notifications/typedefs/send-confirmation-email.typedefs';
import { SendConfirmationEmailUseCase } from '@/modules/notifications/use-cases/send-confirmation-email.use-case';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { OnDomainEvent } from '@/platform/domain-events/decorators/on-domain-event.decorator';
import type { JobHandler } from '@/platform/queues/typedefs/job.typedefs';

@Injectable()
@OnDomainEvent(sendConfirmationEmailJob)
export class SendConfirmationEmailListener implements JobHandler<SendConfirmationEmailInput> {
  constructor(private readonly sendConfirmationEmail: SendConfirmationEmailUseCase) {}

  handle(ctx: UseCaseCtx, data: SendConfirmationEmailInput): Promise<void> {
    return this.sendConfirmationEmail.execute(ctx, data);
  }
}
