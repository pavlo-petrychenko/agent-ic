import { Injectable } from '@nestjs/common';
import { sendUsageThresholdEmailJob } from '@/modules/usage/jobs/send-usage-threshold-email.job';
import type { UsageThresholdReachedInput } from '@/modules/usage/typedefs/usage.typedefs';
import { SendUsageThresholdEmailUseCase } from '@/modules/usage/use-cases/send-usage-threshold-email.use-case';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { OnDomainEvent } from '@/platform/domain-events/decorators/on-domain-event.decorator';
import type { JobHandler } from '@/platform/queues/typedefs/job.typedefs';

@Injectable()
@OnDomainEvent(sendUsageThresholdEmailJob)
export class SendUsageThresholdEmailListener implements JobHandler<UsageThresholdReachedInput> {
  constructor(private readonly sendUsageThresholdEmail: SendUsageThresholdEmailUseCase) {}

  handle(ctx: UseCaseCtx, data: UsageThresholdReachedInput): Promise<void> {
    return this.sendUsageThresholdEmail.execute(ctx, data);
  }
}
