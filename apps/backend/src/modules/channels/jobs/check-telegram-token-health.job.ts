import { z } from 'zod';
import { TELEGRAM_HEALTH_CHECK_INTERVAL_SECONDS } from '@/modules/channels/constants/channel-health.constants';
import { ChannelJobName } from '@/modules/channels/constants/channel-job.constants';
import { QueueName } from '@/platform/queues/constants/queue.constants';
import { defineJob, defineJobSchedule } from '@/platform/queues/helpers/job.helpers';

export const checkTelegramTokenHealthJob = defineJob({
  queue: QueueName.Timers,
  name: ChannelJobName.CheckTelegramTokenHealth,
  schema: z.object({}),
});

export const checkTelegramTokenHealthSchedule = defineJobSchedule({
  job: checkTelegramTokenHealthJob,
  everySeconds: TELEGRAM_HEALTH_CHECK_INTERVAL_SECONDS,
  data: {},
});
