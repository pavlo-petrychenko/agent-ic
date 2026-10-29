import type { z } from 'zod';
import type { ScheduleTickOutcome } from '@/modules/runs/constants/schedule-tick.constants';
import type { scheduleTicks } from '@/modules/runs/db/schedule-ticks.table';
import type { fireScheduleTickJob } from '@/modules/runs/jobs/fire-schedule-tick.job';
import type { sweepScheduleTriggersJob } from '@/modules/runs/jobs/sweep-schedule-triggers.job';

export type FireScheduleTickJobData = z.infer<typeof fireScheduleTickJob.schema>;

export type SweepScheduleTriggersJobData = z.infer<typeof sweepScheduleTriggersJob.schema>;

export type NewScheduleTick = Omit<typeof scheduleTicks.$inferInsert, 'createdAt' | 'updatedAt'>;

export interface ScheduleTickMatches {
  readonly matched: number;
  readonly started: number;
}

export interface ScheduleTickResult extends ScheduleTickMatches {
  readonly outcome: ScheduleTickOutcome | null;
}
