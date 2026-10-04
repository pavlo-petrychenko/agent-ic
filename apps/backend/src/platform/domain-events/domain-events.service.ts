import { Injectable } from '@nestjs/common';

import type { UseCaseCtx } from '@/platform/context/use-case-ctx';
import { JobsService } from '@/platform/queues/jobs.service';
import type { JobData } from '@/platform/queues/queue.typedefs';

import type { DomainEventDefinition } from './domain-event.definition';
import { DomainEventSubscriptionRegistry } from './domain-event-subscription.registry';

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
