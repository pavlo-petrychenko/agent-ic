import { z } from 'zod';
import { NotificationJobName } from '@/modules/notifications/constants/notification-job.constants';
import { TELEGRAM_LINK_SWEEP_INTERVAL_SECONDS } from '@/modules/notifications/constants/telegram-alert.constants';
import { QueueName } from '@/platform/queues/constants/queue.constants';
import { defineJob, defineJobSchedule } from '@/platform/queues/helpers/job.helpers';

export const clearExpiredTelegramLinksJob = defineJob({
  queue: QueueName.Timers,
  name: NotificationJobName.ClearExpiredTelegramLinks,
  schema: z.object({}),
});

export const clearExpiredTelegramLinksSchedule = defineJobSchedule({
  job: clearExpiredTelegramLinksJob,
  everySeconds: TELEGRAM_LINK_SWEEP_INTERVAL_SECONDS,
  data: {},
});
