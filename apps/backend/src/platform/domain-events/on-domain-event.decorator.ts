import { JobProcessor } from '@/platform/queues/job-processor.decorator';
import type { JobData } from '@/platform/queues/queue.typedefs';

import type { DomainEventSubscription } from './domain-event.subscription';

export const OnDomainEvent = <TData extends JobData>(
  subscription: DomainEventSubscription<TData>,
): ClassDecorator => JobProcessor(subscription);
