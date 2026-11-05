import { z } from 'zod';
import { RunJobName } from '@/modules/runs/constants/run-job.constants';
import { SCHEDULE_SWEEP_INTERVAL_SECONDS } from '@/modules/runs/constants/schedule-tick.constants';
import { QueueName } from '@/platform/queues/constants/queue.constants';
import { defineJob, defineJobSchedule } from '@/platform/queues/helpers/job.helpers';

export const sweepScheduleTriggersJob = defineJob({
  queue: QueueName.Timers,
  name: RunJobName.SweepScheduleTriggers,
  schema: z.object({}),
});

export const sweepScheduleTriggersSchedule = defineJobSchedule({
  job: sweepScheduleTriggersJob,
  everySeconds: SCHEDULE_SWEEP_INTERVAL_SECONDS,
  data: {},
});
