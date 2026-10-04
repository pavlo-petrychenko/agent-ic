import { z } from 'zod';
import {
  AUTH_CLEANUP_INTERVAL_SECONDS,
  IdentityJobName,
} from '@/modules/identity/constants/identity-job.constants';
import { QueueName } from '@/platform/queues/constants/queue.constants';
import { defineJob, defineJobSchedule } from '@/platform/queues/helpers/job.helpers';

export const cleanUpAuthRecordsJob = defineJob({
  queue: QueueName.Timers,
  name: IdentityJobName.CleanUpAuthRecords,
  schema: z.object({}),
});

export const cleanUpAuthRecordsSchedule = defineJobSchedule({
  job: cleanUpAuthRecordsJob,
  everySeconds: AUTH_CLEANUP_INTERVAL_SECONDS,
  data: {},
});
