import type { DomainEventSubscription } from '@/platform/domain-events/domain-event.subscription';
import { JobProcessor } from '@/platform/queues/job-processor.decorator';
import type { JobData } from '@/platform/queues/queue.typedefs';

export const OnDomainEvent = <TData extends JobData>(
  subscription: DomainEventSubscription<TData>,
): ClassDecorator => JobProcessor(subscription);
