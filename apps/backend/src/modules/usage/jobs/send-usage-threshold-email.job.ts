import { UsageJobName } from '@/modules/usage/constants/usage-job.constants';
import { usageThresholdReachedEvent } from '@/modules/usage/events/usage-threshold-reached.event';
import { defineDomainEventSubscription } from '@/platform/domain-events/helpers/domain-event.helpers';
import { QueueName } from '@/platform/queues/constants/queue.constants';

export const sendUsageThresholdEmailJob = defineDomainEventSubscription({
  event: usageThresholdReachedEvent,
  queue: QueueName.Notify,
  name: UsageJobName.SendThresholdEmail,
});
