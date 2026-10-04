import type { DomainEventSubscription } from '@/platform/domain-events/domain-event.subscription';
import type { JobData } from '@/platform/queues/queue.typedefs';

export type AnyDomainEventSubscription = DomainEventSubscription<JobData>;
