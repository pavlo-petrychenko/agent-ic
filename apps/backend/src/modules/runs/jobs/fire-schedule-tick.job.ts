import { z } from 'zod';
import { RunJobName } from '@/modules/runs/constants/run-job.constants';
import { QueueName } from '@/platform/queues/constants/queue.constants';
import { defineJob } from '@/platform/queues/helpers/job.helpers';

export const fireScheduleTickJob = defineJob({
  queue: QueueName.RunsProactive,
  name: RunJobName.FireScheduleTick,
  schema: z.object({
    agentId: z.uuid(),
    versionId: z.uuid(),
    nodeId: z.string().min(1),
    scheduledFor: z.iso.datetime(),
    missed: z.boolean(),
  }),
});
