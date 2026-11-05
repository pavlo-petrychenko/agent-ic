import { z } from 'zod';
import { RunJobName } from '@/modules/runs/constants/run-job.constants';
import { QueueName } from '@/platform/queues/constants/queue.constants';
import { defineJob } from '@/platform/queues/helpers/job.helpers';

export const fireInactivityTimerJob = defineJob({
  queue: QueueName.RunsProactive,
  name: RunJobName.FireInactivityTimer,
  schema: z.object({ timerId: z.uuid() }),
});
