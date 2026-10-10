import { z } from 'zod';
import { RunJobName } from '@/modules/runs/constants/run-job.constants';
import { QueueName } from '@/platform/queues/constants/queue.constants';
import { defineJob } from '@/platform/queues/helpers/job.helpers';

export const executeRunJob = defineJob({
  queue: QueueName.RunsReactive,
  name: RunJobName.Execute,
  schema: z.object({ runId: z.uuid() }),
});
