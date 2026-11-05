import {
  RUNS_SCHEMA,
  RunStatus,
  RunStepStatus,
  RunTrigger,
} from '@/modules/runs/constants/run.constants';
import { ScheduleTickOutcome } from '@/modules/runs/constants/schedule-tick.constants';
import { moduleSchema } from '@/platform/database/helpers/tenant-table.helpers';

export const runsSchema = moduleSchema(RUNS_SCHEMA);

export const runTriggerEnum = runsSchema.enum('run_trigger', [
  RunTrigger.Message,
  RunTrigger.Schedule,
  RunTrigger.Inactivity,
]);

export const runStatusEnum = runsSchema.enum('run_status', [
  RunStatus.Queued,
  RunStatus.Running,
  RunStatus.Succeeded,
  RunStatus.Failed,
  RunStatus.Escalated,
]);

export const runStepStatusEnum = runsSchema.enum('run_step_status', [
  RunStepStatus.Running,
  RunStepStatus.Succeeded,
  RunStepStatus.Failed,
]);

export const scheduleTickOutcomeEnum = runsSchema.enum('schedule_tick_outcome', [
  ScheduleTickOutcome.Fired,
  ScheduleTickOutcome.SkippedPaused,
  ScheduleTickOutcome.SkippedChanged,
  ScheduleTickOutcome.SkippedUsageLimit,
  ScheduleTickOutcome.SkippedMissed,
]);
