import { emailConfirmationRequestedEvent } from '@/modules/identity';
import { NotificationJobName } from '@/modules/notifications/constants/notification-job.constants';
import { defineDomainEventSubscription } from '@/platform/domain-events/helpers/domain-event.helpers';
import { QueueName } from '@/platform/queues/constants/queue.constants';

export const sendConfirmationEmailJob = defineDomainEventSubscription({
  event: emailConfirmationRequestedEvent,
  queue: QueueName.Notify,
  name: NotificationJobName.SendConfirmationEmail,
});
