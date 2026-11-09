import { z } from 'zod';
import { DELIVERY_SWEEP_INTERVAL_SECONDS, NotificationJobName } from '@/modules/notifications';
import { QueueName } from '@/platform/queues/constants/queue.constants';
import { defineJob, defineJobSchedule } from '@/platform/queues/helpers/job.helpers';

export const sweepNotificationDeliveriesJob = defineJob({
  queue: QueueName.Timers,
  name: NotificationJobName.SweepNotificationDeliveries,
  schema: z.object({}),
});

export const sweepNotificationDeliveriesSchedule = defineJobSchedule({
  job: sweepNotificationDeliveriesJob,
  everySeconds: DELIVERY_SWEEP_INTERVAL_SECONDS,
  data: {},
});
