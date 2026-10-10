import { messageReceivedEvent } from '@/modules/conversations/events/message-received.event';
import { needsOperatorEvent } from '@/modules/conversations/events/needs-operator.event';
import { outboundQueuedEvent } from '@/modules/conversations/events/outbound-queued.event';
import { defineDomainEventSubscription } from '@/platform/domain-events/helpers/domain-event.helpers';
import { QueueName } from '@/platform/queues/constants/queue.constants';
import { ConversationProbeJobName } from '@test/support/constants/conversations-testing.constants';

export const deliverOnOutboundQueued = defineDomainEventSubscription({
  event: outboundQueuedEvent,
  queue: QueueName.Outbound,
  name: ConversationProbeJobName.DeliverOutbound,
});

export const notifyOnNeedsOperator = defineDomainEventSubscription({
  event: needsOperatorEvent,
  queue: QueueName.Notify,
  name: ConversationProbeJobName.NotifyOperator,
});

export const runOnMessageReceived = defineDomainEventSubscription({
  event: messageReceivedEvent,
  queue: QueueName.RunsReactive,
  name: ConversationProbeJobName.RequestRun,
});
