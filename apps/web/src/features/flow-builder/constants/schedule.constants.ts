import { ChannelType, ScheduleKind } from '@agent-ic/flow';
import { DurationUnit } from '@/shared/forms/constants/duration.constants';

export const SCHEDULE_DEFAULT_TIME = '10:00';
export const SCHEDULE_DEFAULT_SILENT_HOURS = 24;
export const SCHEDULE_DEFAULT_MAX_CONVERSATIONS = 50;
export const SCHEDULE_MIN_CONVERSATIONS = 1;
export const SCHEDULE_NEXT_RUN_COUNT = 3;
export const SCHEDULE_SILENCE_UNITS: readonly DurationUnit[] = [
  DurationUnit.Hour,
  DurationUnit.Day,
];
export const SCHEDULE_CRON_PLACEHOLDER = '0 10 * * *';

export const SCHEDULE_KINDS: readonly ScheduleKind[] = [
  ScheduleKind.Daily,
  ScheduleKind.Weekdays,
  ScheduleKind.Custom,
];

export const SCHEDULE_CHANNEL_TYPES: readonly ChannelType[] = [
  ChannelType.Telegram,
  ChannelType.Api,
];

export enum SchedulePath {
  Cron = 'schedule.cron',
  TimeZone = 'schedule.timeZone',
  Schedule = 'schedule',
  ChannelTypes = 'conditions.channelTypes',
  SilentForHours = 'conditions.silentForHours',
  MaxConversations = 'maxConversationsPerRun',
}

export const RUN_FORMAT = {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
} as const satisfies Intl.DateTimeFormatOptions;
