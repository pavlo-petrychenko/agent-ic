import { Injectable } from '@nestjs/common';
import type { UseCaseCtx } from '@/platform/context/use-case-ctx';
import { DomainEventListenersService } from '@/platform/domain-events/services/domain-event-listeners.service';
import type { DomainEventDefinition } from '@/platform/domain-events/typedefs/domain-event.typedefs';
import { JobsService } from '@/platform/queues/services/jobs.service';
import type { JobData } from '@/platform/queues/typedefs/job.typedefs';

@Injectable()
export class DomainEventsService {
  constructor(
    private readonly listeners: DomainEventListenersService,
    private readonly jobs: JobsService,
  ) {}

  async emit<TData extends JobData>(
    ctx: UseCaseCtx,
    event: DomainEventDefinition<TData>,
    data: TData,
  ): Promise<void> {
    const payload = event.schema.parse(data);
    for (const subscription of this.listeners.subscriptionsFor(event)) {
      await this.jobs.enqueue(ctx, subscription, payload);
    }
  }
}
