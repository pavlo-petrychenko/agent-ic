import type { z } from 'zod';
import type { JobData } from '@/platform/queues/queue.typedefs';

export abstract class DomainEventDefinition<TData extends JobData> {
  abstract readonly name: string;
  abstract readonly schema: z.ZodType<TData>;
}
