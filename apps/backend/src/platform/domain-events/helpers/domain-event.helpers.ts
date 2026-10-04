import { SUBSCRIPTION_EVENT_FIELD } from '@/platform/domain-events/constants/domain-event.constants';
import type {
  AnyDomainEventSubscription,
  DomainEventDefinition,
  DomainEventSubscription,
  DomainEventSubscriptionInput,
} from '@/platform/domain-events/typedefs/domain-event.typedefs';
import type { JobData } from '@/platform/queues/typedefs/job.typedefs';

export const defineDomainEvent = <TData extends JobData>(
  definition: DomainEventDefinition<TData>,
): DomainEventDefinition<TData> => Object.freeze({ ...definition });

export const defineDomainEventSubscription = <TData extends JobData>(
  subscription: DomainEventSubscriptionInput<TData>,
): DomainEventSubscription<TData> =>
  Object.freeze({ ...subscription, schema: subscription.event.schema });

export const isDomainEventSubscription = (value: unknown): value is AnyDomainEventSubscription =>
  typeof value === 'object' &&
  value !== null &&
  SUBSCRIPTION_EVENT_FIELD in value &&
  typeof value[SUBSCRIPTION_EVENT_FIELD] === 'object';
