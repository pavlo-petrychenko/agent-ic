import { Injectable } from '@nestjs/common';
import { deliverOutboundMessageJob } from '@/modules/channels/jobs/deliver-outbound-message.job';
import { DeliverOutboundMessageUseCase } from '@/modules/channels/use-cases/deliver-outbound-message.use-case';
import type { OutboundQueuedPayload } from '@/modules/conversations';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { OnDomainEvent } from '@/platform/domain-events/decorators/on-domain-event.decorator';
import type { JobHandler } from '@/platform/queues/typedefs/job.typedefs';

@Injectable()
@OnDomainEvent(deliverOutboundMessageJob)
export class DeliverOutboundMessageListener implements JobHandler<OutboundQueuedPayload> {
  constructor(private readonly deliverOutboundMessage: DeliverOutboundMessageUseCase) {}

  handle(ctx: UseCaseCtx, data: OutboundQueuedPayload): Promise<void> {
    return this.deliverOutboundMessage.execute(ctx, data);
  }
}
