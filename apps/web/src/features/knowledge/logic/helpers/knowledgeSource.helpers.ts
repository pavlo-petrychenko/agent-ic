import {
  KNOWLEDGE_SCHEDULE_DEFAULT_TIME,
  KNOWLEDGE_SCHEDULE_DEFAULT_WEEKDAY,
  KNOWLEDGE_SOURCE_DATE_FORMAT,
  KNOWLEDGE_SOURCE_NON_RETRYABLE_CODES,
  KnowledgeScheduleMode,
  KnowledgeSourceKind,
  KnowledgeSourceStatus,
  KnowledgeSyncInterval,
} from '@/features/knowledge/constants/knowledgeSource.constants';
import type {
  KnowledgeSource,
  KnowledgeSourceSchedule,
  KnowledgeSourceScheduleInput,
} from '@/features/knowledge/typedefs/knowledgeSource.typedefs';

export const isKnowledgeSourceActive = (status: KnowledgeSourceStatus): boolean =>
  status === KnowledgeSourceStatus.Pending || status === KnowledgeSourceStatus.Indexing;

export const isKnowledgeSourceRetryable = (
  status: KnowledgeSourceStatus,
  lastErrorCode: string | null,
): boolean =>
  status === KnowledgeSourceStatus.Error &&
  (lastErrorCode === null || !KNOWLEDGE_SOURCE_NON_RETRYABLE_CODES.has(lastErrorCode));

export const canSyncKnowledgeSource = (
  source: KnowledgeSource,
  connectionActive: boolean,
): boolean =>
  connectionActive &&
  source.kind === KnowledgeSourceKind.GoogleDocs &&
  source.status === KnowledgeSourceStatus.Ready;

export const formatKnowledgeSourceDate = (iso: string, locale: string): string =>
  new Intl.DateTimeFormat(locale, KNOWLEDGE_SOURCE_DATE_FORMAT).format(new Date(iso));

export const knowledgeScheduleOf = (source: KnowledgeSource): KnowledgeSourceSchedule => ({
  mode:
    source.syncInterval === null ? KnowledgeScheduleMode.Manual : KnowledgeScheduleMode.Scheduled,
  preset: source.syncInterval ?? KnowledgeSyncInterval.Daily,
  time: source.syncTime ?? KNOWLEDGE_SCHEDULE_DEFAULT_TIME,
  weekday: source.syncWeekday ?? KNOWLEDGE_SCHEDULE_DEFAULT_WEEKDAY,
});

export const knowledgeScheduleInput = (
  schedule: KnowledgeSourceSchedule,
): KnowledgeSourceScheduleInput => {
  if (schedule.mode === KnowledgeScheduleMode.Manual) {
    return { syncInterval: null, syncTime: null, syncWeekday: null };
  }
  if (schedule.preset === KnowledgeSyncInterval.Hourly) {
    return { syncInterval: KnowledgeSyncInterval.Hourly, syncTime: null, syncWeekday: null };
  }
  if (schedule.preset === KnowledgeSyncInterval.Weekly) {
    return {
      syncInterval: KnowledgeSyncInterval.Weekly,
      syncTime: schedule.time,
      syncWeekday: schedule.weekday,
    };
  }
  return {
    syncInterval: KnowledgeSyncInterval.Daily,
    syncTime: schedule.time,
    syncWeekday: null,
  };
};
