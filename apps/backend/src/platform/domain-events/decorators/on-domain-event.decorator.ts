import { applyDecorators, SetMetadata } from '@nestjs/common';
import { DOMAIN_EVENT_LISTENER_SUBSCRIPTION } from '@/platform/domain-events/constants/domain-event.constants';
import type { DomainEventSubscription } from '@/platform/domain-events/typedefs/domain-event.typedefs';
import { ProcessJob } from '@/platform/queues/decorators/process-job.decorator';
import type { JobData } from '@/platform/queues/typedefs/job.typedefs';

export const OnDomainEvent = <TData extends JobData>(
  subscription: DomainEventSubscription<TData>,
): ClassDecorator =>
  applyDecorators(
    ProcessJob(subscription),
    SetMetadata(DOMAIN_EVENT_LISTENER_SUBSCRIPTION, subscription),
  );
