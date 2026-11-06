import { z } from 'zod';
import { NotificationChannel, NotificationJobName } from '@/modules/notifications';
import { QueueName } from '@/platform/queues/constants/queue.constants';
import { defineJob } from '@/platform/queues/helpers/job.helpers';

export const deliverNotificationJob = defineJob({
  queue: QueueName.Notify,
  name: NotificationJobName.DeliverNotification,
  schema: z.object({
    notificationId: z.uuid(),
    channel: z.enum(NotificationChannel),
  }),
});

export type DeliverNotificationJobData = z.infer<typeof deliverNotificationJob.schema>;
