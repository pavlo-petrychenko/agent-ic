import type { z } from 'zod';
import type { executeRunJob } from '@/modules/runs/jobs/execute-run.job';
import type { fireInactivityTimerJob } from '@/modules/runs/jobs/fire-inactivity-timer.job';
import type { sweepInactivityTimersJob } from '@/modules/runs/jobs/sweep-inactivity-timers.job';

export type ExecuteRunJobData = z.infer<typeof executeRunJob.schema>;

export type FireInactivityTimerJobData = z.infer<typeof fireInactivityTimerJob.schema>;

export type SweepInactivityTimersJobData = z.infer<typeof sweepInactivityTimersJob.schema>;
