import { QueueName } from '@/platform/queues/constants/queue.constants';
import { defineJob, defineJobSchedule } from '@/platform/queues/helpers/job.helpers';
import {
  ProbeJobName,
  SCHEDULED_PROBE_EVERY_SECONDS,
  SCHEDULED_PROBE_ID,
} from '@test/support/constants/async-jobs.constants';
import { probeDataSchema } from '@test/support/schemas/async-jobs.schema';

export const scheduledProbeJob = defineJob({
  queue: QueueName.Notify,
  name: ProbeJobName.Scheduled,
  schema: probeDataSchema,
});

export const scheduledProbeSchedule = defineJobSchedule({
  job: scheduledProbeJob,
  everySeconds: SCHEDULED_PROBE_EVERY_SECONDS,
  data: { probeId: SCHEDULED_PROBE_ID },
});
