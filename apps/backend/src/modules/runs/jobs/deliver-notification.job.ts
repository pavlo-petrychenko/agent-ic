import { z } from 'zod';
import { NotificationJobName } from '@/modules/notifications';
import { deliverNotificationSchema } from '@/modules/runs/schemas/deliver-notification-job.schema';
import { QueueName } from '@/platform/queues/constants/queue.constants';
import { defineJob } from '@/platform/queues/helpers/job.helpers';

export const deliverNotificationJob = defineJob({
  queue: QueueName.Notify,
  name: NotificationJobName.DeliverNotification,
  schema: deliverNotificationSchema,
});

export type DeliverNotificationJobData = z.infer<typeof deliverNotificationJob.schema>;
