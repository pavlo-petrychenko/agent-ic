import { z } from 'zod';
import { KnowledgeJobName } from '@/modules/knowledge/constants/knowledge-job.constants';
import { QueueName } from '@/platform/queues/constants/queue.constants';
import { defineJob } from '@/platform/queues/helpers/job.helpers';

export const cleanUpKnowledgeSourceFilesJob = defineJob({
  queue: QueueName.Timers,
  name: KnowledgeJobName.CleanUpSourceFiles,
  schema: z.object({ sourceId: z.uuid() }),
});
