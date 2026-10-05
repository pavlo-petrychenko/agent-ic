import { z } from 'zod';
import {
  OUTBOX_SWEEP_INTERVAL_SECONDS,
  OutboxJobName,
} from '@/platform/queues/constants/outbox.constants';
import { QueueName } from '@/platform/queues/constants/queue.constants';
import { defineJob, defineJobSchedule } from '@/platform/queues/helpers/job.helpers';

export const sweepOutboxJob = defineJob({
  queue: QueueName.Timers,
  name: OutboxJobName.Sweep,
  schema: z.object({}),
});

export const sweepOutboxSchedule = defineJobSchedule({
  job: sweepOutboxJob,
  everySeconds: OUTBOX_SWEEP_INTERVAL_SECONDS,
  data: {},
});
