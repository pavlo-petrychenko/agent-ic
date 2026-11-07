import { NotificationJobName, telegramAlertTakeOverRequestedEvent } from '@/modules/notifications';
import { defineDomainEventSubscription } from '@/platform/domain-events/helpers/domain-event.helpers';
import { QueueName } from '@/platform/queues/constants/queue.constants';

export const telegramAlertTakeOverJob = defineDomainEventSubscription({
  event: telegramAlertTakeOverRequestedEvent,
  queue: QueueName.Notify,
  name: NotificationJobName.TelegramAlertTakeOver,
});
