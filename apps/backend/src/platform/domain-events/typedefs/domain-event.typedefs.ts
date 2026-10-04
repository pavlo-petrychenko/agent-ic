import type { z } from 'zod';
import type { JobData, JobDefinition } from '@/platform/queues/typedefs/job.typedefs';

export interface DomainEventDefinition<TData extends JobData> {
  readonly name: string;
  readonly schema: z.ZodType<TData>;
}

export interface DomainEventSubscription<TData extends JobData> extends JobDefinition<TData> {
  readonly event: DomainEventDefinition<TData>;
}

export type DomainEventSubscriptionInput<TData extends JobData> = Omit<
  DomainEventSubscription<TData>,
  'schema'
>;

export type AnyDomainEventSubscription = DomainEventSubscription<JobData>;
