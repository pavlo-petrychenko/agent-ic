import type { z } from 'zod';

import { JobDefinition } from '@/platform/queues/job.definition';
import type { JobData } from '@/platform/queues/queue.typedefs';

import type { DomainEventDefinition } from './domain-event.definition';

export abstract class DomainEventSubscription<TData extends JobData> extends JobDefinition<TData> {
  abstract readonly event: DomainEventDefinition<TData>;

  get schema(): z.ZodType<TData> {
    return this.event.schema;
  }
}
