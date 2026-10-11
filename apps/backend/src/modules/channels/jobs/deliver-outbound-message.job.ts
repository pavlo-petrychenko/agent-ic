import { ChannelJobName } from '@/modules/channels/constants/channel-job.constants';
import { outboundQueuedEvent } from '@/modules/conversations';
import { defineDomainEventSubscription } from '@/platform/domain-events/helpers/domain-event.helpers';
import { QueueName } from '@/platform/queues/constants/queue.constants';

export const deliverOutboundMessageJob = defineDomainEventSubscription({
  event: outboundQueuedEvent,
  queue: QueueName.Outbound,
  name: ChannelJobName.DeliverOutboundMessage,
});
