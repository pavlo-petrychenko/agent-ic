import { NotificationJobName } from '@/modules/notifications/constants/notification-job.constants';
import { notificationEmailVerificationRequestedEvent } from '@/modules/notifications/events/notification-email-verification-requested.event';
import { defineDomainEventSubscription } from '@/platform/domain-events/helpers/domain-event.helpers';
import { QueueName } from '@/platform/queues/constants/queue.constants';

export const sendNotificationEmailVerificationJob = defineDomainEventSubscription({
  event: notificationEmailVerificationRequestedEvent,
  queue: QueueName.Notify,
  name: NotificationJobName.SendEmailVerificationEmail,
});
