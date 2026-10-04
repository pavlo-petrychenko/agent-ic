import type { z } from 'zod';
import type { DomainEventDefinition } from '@/platform/domain-events/domain-event.definition';
import { JobDefinition } from '@/platform/queues/job.definition';
import type { JobData } from '@/platform/queues/queue.typedefs';

export abstract class DomainEventSubscription<TData extends JobData> extends JobDefinition<TData> {
  abstract readonly event: DomainEventDefinition<TData>;

  get schema(): z.ZodType<TData> {
    return this.event.schema;
  }
}
