import { z } from 'zod';
import { INACTIVITY_SWEEP_INTERVAL_SECONDS } from '@/modules/runs/constants/inactivity.constants';
import { RunJobName } from '@/modules/runs/constants/run-job.constants';
import { QueueName } from '@/platform/queues/constants/queue.constants';
import { defineJob, defineJobSchedule } from '@/platform/queues/helpers/job.helpers';

export const sweepInactivityTimersJob = defineJob({
  queue: QueueName.Timers,
  name: RunJobName.SweepInactivityTimers,
  schema: z.object({}),
});

export const sweepInactivityTimersSchedule = defineJobSchedule({
  job: sweepInactivityTimersJob,
  everySeconds: INACTIVITY_SWEEP_INTERVAL_SECONDS,
  data: {},
});
