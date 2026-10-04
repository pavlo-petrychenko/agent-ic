import { Injectable } from '@nestjs/common';
import type { UseCaseCtx } from '@/platform/context/use-case-ctx';
import { DomainEventSubscriptionRegistry } from '@/platform/domain-events/domain-event-subscription.registry';
import type { DomainEventDefinition } from '@/platform/domain-events/domain-event.definition';
import { JobsService } from '@/platform/queues/jobs.service';
import type { JobData } from '@/platform/queues/queue.typedefs';

@Injectable()
export class DomainEventsService {
  constructor(
    private readonly subscriptions: DomainEventSubscriptionRegistry,
    private readonly jobs: JobsService,
  ) {}

  async emit<TData extends JobData>(
    ctx: UseCaseCtx,
    event: DomainEventDefinition<TData>,
    data: TData,
  ): Promise<void> {
    const payload = event.schema.parse(data);
    for (const subscription of this.subscriptions.subscriptionsFor(event)) {
      await this.jobs.enqueue(ctx, subscription, payload);
    }
  }
}
