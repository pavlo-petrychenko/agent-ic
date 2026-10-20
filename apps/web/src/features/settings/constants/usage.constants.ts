import type { UsageMetric } from '@/features/settings/typedefs/usage.typedefs';

export enum UsageFormat {
  Percent = 'percent',
  Count = 'count',
  Chunks = 'chunks',
}

export const USAGE_WARN_PERCENT = 80;
export const USAGE_FULL_PERCENT = 100;

export const USAGE_DAY_FORMAT: Intl.DateTimeFormatOptions = {
  month: 'short',
  day: 'numeric',
};

export const USAGE_ROWS = [
  {
    id: 'platformModels',
    labelKey: 'usage.rows.platformModels',
    noteKey: 'usage.notes.platformModels',
    format: UsageFormat.Percent,
    used: 7200,
    limit: 10000,
  },
  {
    id: 'conversations',
    labelKey: 'usage.rows.conversations',
    noteKey: 'usage.notes.conversations',
    format: UsageFormat.Count,
    used: 4190,
    limit: 10000,
  },
  {
    id: 'knowledge',
    labelKey: 'usage.rows.knowledge',
    noteKey: 'usage.notes.knowledge',
    format: UsageFormat.Chunks,
    used: 107,
    limit: 5000,
  },
] as const satisfies readonly UsageMetric[];
