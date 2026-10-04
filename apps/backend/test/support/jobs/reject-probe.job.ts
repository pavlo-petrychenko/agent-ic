import { QueueName } from '@/platform/queues/constants/queue.constants';
import { defineJob } from '@/platform/queues/helpers/job.helpers';
import { ProbeJobName } from '@test/support/constants/async-jobs.constants';
import { probeDataSchema } from '@test/support/schemas/async-jobs.schema';

export const rejectProbeJob = defineJob({
  queue: QueueName.Notify,
  name: ProbeJobName.Reject,
  schema: probeDataSchema,
});
