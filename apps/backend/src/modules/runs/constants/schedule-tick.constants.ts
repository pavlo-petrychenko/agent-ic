export enum ScheduleTickOutcome {
  Fired = 'fired',
  SkippedPaused = 'skipped_paused',
  SkippedChanged = 'skipped_changed',
  SkippedUsageLimit = 'skipped_usage_limit',
  SkippedMissed = 'skipped_missed',
}

export enum ScheduleMatchOutcome {
  Started = 'started',
  Busy = 'busy',
}

export const SCHEDULE_SWEEP_INTERVAL_SECONDS = 30;

export const SCHEDULE_TICK_JOB_ID_PREFIX = 'schedule';
export const SCHEDULE_TICK_JOB_ID_SEPARATOR = '-';

export const SCHEDULED_FOR_INPUT_KEY = 'scheduled_for';

export enum ScheduleMetricName {
  Sweeps = 'schedule_sweeps_total',
  Ticks = 'schedule_ticks_total',
  TickLag = 'schedule_tick_lag_seconds',
  TicksMissed = 'schedule_ticks_missed_total',
  Matches = 'schedule_matches_total',
}

export enum ScheduleMetricHelp {
  Sweeps = 'Sweeps that looked for due schedule triggers',
  Ticks = 'Schedule ticks that were handled, by outcome',
  TickLag = 'Time from a schedule tick to the moment it fired in seconds',
  TicksMissed = 'Schedule ticks skipped because they were too late',
  Matches = 'Conversations a schedule tick matched, by outcome',
}

export enum ScheduleMetricLabel {
  Outcome = 'outcome',
}

export const SCHEDULE_TICK_LAG_BUCKETS_SECONDS: readonly number[] = [
  1, 5, 10, 20, 30, 45, 60, 90, 120, 300, 600,
];

export enum ScheduleConditionKind {
  CustomerWrote = 'customer_wrote',
  SilentFor = 'silent_for',
  NotEscalated = 'not_escalated',
  ChannelType = 'channel_type',
}
