import type { UsageRowDefinition } from '@/features/settings/typedefs/usage.typedefs';

export enum UsageFormat {
  Percent = 'percent',
  Count = 'count',
  Chunks = 'chunks',
}

export enum UsageMetricKey {
  Credits = 'credits',
  Conversations = 'conversations',
  Chunks = 'chunks',
}

export const USAGE_WARN_PERCENT = 80;
export const USAGE_FULL_PERCENT = 100;

export const USAGE_TIME_ZONE = 'UTC';

export const USAGE_DAY_FORMAT: Intl.DateTimeFormatOptions = {
  month: 'short',
  day: 'numeric',
  timeZone: USAGE_TIME_ZONE,
};

export const USAGE_ROW_DEFINITIONS = [
  {
    key: UsageMetricKey.Credits,
    labelKey: 'usage.rows.platformModels',
    noteKey: 'usage.notes.platformModels',
    format: UsageFormat.Percent,
  },
  {
    key: UsageMetricKey.Conversations,
    labelKey: 'usage.rows.conversations',
    noteKey: 'usage.notes.conversations',
    format: UsageFormat.Count,
  },
  {
    key: UsageMetricKey.Chunks,
    labelKey: 'usage.rows.knowledge',
    noteKey: 'usage.notes.knowledge',
    format: UsageFormat.Chunks,
  },
] as const satisfies readonly UsageRowDefinition[];
