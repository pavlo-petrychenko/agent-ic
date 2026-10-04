import type { JobData } from '@/platform/queues/queue.typedefs';

import type { DomainEventSubscription } from './domain-event.subscription';

export type AnyDomainEventSubscription = DomainEventSubscription<JobData>;
