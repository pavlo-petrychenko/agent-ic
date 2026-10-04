import { applyDecorators, SetMetadata } from '@nestjs/common';
import type { DomainEventSubscription } from '@/platform/domain-events/domain-event.subscription';
import { DOMAIN_EVENT_LISTENER_SUBSCRIPTION } from '@/platform/domain-events/domain-events.constants';
import { JobProcessor } from '@/platform/queues/job-processor.decorator';
import type { JobData } from '@/platform/queues/queue.typedefs';

export const OnDomainEvent = <TData extends JobData>(
  subscription: DomainEventSubscription<TData>,
): ClassDecorator =>
  applyDecorators(
    JobProcessor(subscription),
    SetMetadata(DOMAIN_EVENT_LISTENER_SUBSCRIPTION, subscription),
  );
