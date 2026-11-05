import { ErrorReason } from '@agent-ic/contracts';
import { nextTicks, ScheduleKind } from '@agent-ic/flow';
import { KnowledgeField } from '@/modules/knowledge/constants/knowledge-input.constants';
import {
  KNOWLEDGE_SCHEDULE_CRON_EVERY,
  KNOWLEDGE_SCHEDULE_DEFAULT_TIME,
  KNOWLEDGE_SCHEDULE_DEFAULT_WEEKDAY,
  KNOWLEDGE_SCHEDULE_HOURLY_CRON,
  KNOWLEDGE_SCHEDULE_SCHEDULER_PREFIX,
  KNOWLEDGE_SCHEDULE_TIME_SEPARATOR,
} from '@/modules/knowledge/constants/knowledge-schedule.constants';
import { KnowledgeSyncInterval } from '@/modules/knowledge/constants/knowledge.constants';
import { InvalidKnowledgeInputError } from '@/modules/knowledge/errors/invalid-knowledge-input.error';
import type {
  KnowledgeScheduleInput,
  SourceScheduleFields,
} from '@/modules/knowledge/typedefs/source-schedule.typedefs';
import type { Source } from '@/modules/knowledge/typedefs/source.typedefs';

interface SourceSchedule {
  readonly interval: KnowledgeSyncInterval;
  readonly time: string | null;
  readonly weekday: number | null;
  readonly timezone: string;
}

const timeParts = (time: string): readonly [string, string] => {
  const [hour, minute] = time.split(KNOWLEDGE_SCHEDULE_TIME_SEPARATOR);
  return [hour ?? KNOWLEDGE_SCHEDULE_DEFAULT_TIME.slice(0, 2), minute ?? '00'];
};

export const knowledgeSyncSchedulerId = (sourceId: string): string =>
  `${KNOWLEDGE_SCHEDULE_SCHEDULER_PREFIX}:${sourceId}`;

export const knowledgeScheduleTime = (time: string | null): string | null =>
  time === null ? null : time.slice(0, 5);

export const knowledgeScheduleRepeat = (
  source: Source,
): { readonly pattern: string; readonly tz: string } => {
  if (source.syncInterval === null || source.timezone === null) {
    throw new InvalidKnowledgeInputError([
      { path: KnowledgeField.SyncInterval, reason: ErrorReason.InvalidRequest },
    ]);
  }
  return {
    pattern: knowledgeScheduleCron({
      interval: source.syncInterval,
      time: source.syncTime,
      weekday: source.syncWeekday,
    }),
    tz: source.timezone,
  };
};

export const nextSourceSyncAt = (source: Source, after: Date): Date => {
  if (source.syncInterval === null || source.timezone === null) {
    throw new InvalidKnowledgeInputError([
      { path: KnowledgeField.SyncInterval, reason: ErrorReason.InvalidRequest },
    ]);
  }
  return nextScheduleAt(
    {
      interval: source.syncInterval,
      time: source.syncTime,
      weekday: source.syncWeekday,
      timezone: source.timezone,
    },
    after,
  );
};

export const knowledgeScheduleCron = ({
  interval,
  time,
  weekday,
}: Omit<SourceSchedule, 'timezone'>): string => {
  if (interval === KnowledgeSyncInterval.Hourly) {
    return KNOWLEDGE_SCHEDULE_HOURLY_CRON;
  }
  const [hour, minute] = timeParts(time ?? KNOWLEDGE_SCHEDULE_DEFAULT_TIME);
  return [
    minute,
    hour,
    KNOWLEDGE_SCHEDULE_CRON_EVERY,
    KNOWLEDGE_SCHEDULE_CRON_EVERY,
    interval === KnowledgeSyncInterval.Weekly
      ? String(weekday ?? KNOWLEDGE_SCHEDULE_DEFAULT_WEEKDAY)
      : KNOWLEDGE_SCHEDULE_CRON_EVERY,
  ].join(' ');
};

const nextScheduleAt = (schedule: SourceSchedule, after: Date): Date => {
  const [next] = nextTicks(
    {
      kind: ScheduleKind.Custom,
      cron: knowledgeScheduleCron(schedule),
      timeZone: schedule.timezone,
    },
    after,
    1,
  );
  if (next === undefined) {
    throw new InvalidKnowledgeInputError([
      { path: KnowledgeField.SyncTime, reason: ErrorReason.InvalidRequest },
    ]);
  }
  return next;
};

export const sourceScheduleFields = (
  input: KnowledgeScheduleInput,
  timezone: string,
  now: Date,
): SourceScheduleFields => {
  if (input.syncInterval === null) {
    return {
      syncInterval: null,
      syncTime: null,
      syncWeekday: null,
      timezone: null,
      nextSyncAt: null,
    };
  }
  const time =
    input.syncInterval === KnowledgeSyncInterval.Hourly
      ? null
      : (input.syncTime ?? KNOWLEDGE_SCHEDULE_DEFAULT_TIME);
  const weekday =
    input.syncInterval === KnowledgeSyncInterval.Weekly
      ? (input.syncWeekday ?? KNOWLEDGE_SCHEDULE_DEFAULT_WEEKDAY)
      : null;
  return {
    syncInterval: input.syncInterval,
    syncTime: time,
    syncWeekday: weekday,
    timezone,
    nextSyncAt: nextScheduleAt({ interval: input.syncInterval, time, weekday, timezone }, now),
  };
};
