import { Injectable } from '@nestjs/common';
import type { MessageReceivedPayload } from '@/modules/conversations';
import { startRunOnMessageJob } from '@/modules/runs/jobs/start-run-on-message.job';
import { StartRunOnMessageUseCase } from '@/modules/runs/use-cases/start-run-on-message.use-case';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { OnDomainEvent } from '@/platform/domain-events/decorators/on-domain-event.decorator';
import type { JobHandler } from '@/platform/queues/typedefs/job.typedefs';

@Injectable()
@OnDomainEvent(startRunOnMessageJob)
export class StartRunOnMessageListener implements JobHandler<MessageReceivedPayload> {
  constructor(private readonly startRunOnMessage: StartRunOnMessageUseCase) {}

  async handle(ctx: UseCaseCtx, data: MessageReceivedPayload): Promise<void> {
    await this.startRunOnMessage.execute(ctx, data);
  }
}
