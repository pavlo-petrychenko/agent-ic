import { NotificationJobName } from '@/modules/notifications';
import { runEscalatedEvent } from '@/modules/runs/events/run-escalated.event';
import { defineDomainEventSubscription } from '@/platform/domain-events/helpers/domain-event.helpers';
import { QueueName } from '@/platform/queues/constants/queue.constants';

export const createEscalationNotificationsJob = defineDomainEventSubscription({
  event: runEscalatedEvent,
  queue: QueueName.Notify,
  name: NotificationJobName.CreateEscalationNotifications,
});
