import { z } from 'zod';
import { EscalationTimerKind } from '@/modules/runs/constants/escalation-reminder.constants';
import { RunJobName } from '@/modules/runs/constants/run-job.constants';
import { QueueName } from '@/platform/queues/constants/queue.constants';
import { defineJob } from '@/platform/queues/helpers/job.helpers';

export const fireEscalationTimerJob = defineJob({
  queue: QueueName.Timers,
  name: RunJobName.FireEscalationTimer,
  schema: z.object({
    runStepId: z.uuid(),
    kind: z.enum(EscalationTimerKind),
  }),
});
