import { messageReceivedEvent } from '@/modules/conversations';
import { RunJobName } from '@/modules/runs/constants/run-job.constants';
import { defineDomainEventSubscription } from '@/platform/domain-events/helpers/domain-event.helpers';
import { QueueName } from '@/platform/queues/constants/queue.constants';

export const startRunOnMessageJob = defineDomainEventSubscription({
  event: messageReceivedEvent,
  queue: QueueName.RunsReactive,
  name: RunJobName.StartOnMessage,
});
