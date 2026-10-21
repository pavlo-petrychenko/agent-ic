import {
  USAGE_DAY_FORMAT,
  USAGE_FULL_PERCENT,
  USAGE_WARN_PERCENT,
} from '@/features/settings/constants/usage.constants';
import { UsageWhenKind } from '@/features/settings/typedefs/usage.typedefs';
import type { UsageWhen } from '@/features/settings/typedefs/usage.typedefs';
import { ProgressTone } from '@/shared/ui/display/Progress/Progress.constants';

const MILLISECONDS_PER_DAY = 86_400_000;

export const usagePercent = (used: number, limit: number): number => {
  if (limit <= 0) {
    return 0;
  }
  return Math.min(USAGE_FULL_PERCENT, Math.round((used / limit) * USAGE_FULL_PERCENT));
};

export const usageTone = (percent: number): ProgressTone => {
  if (percent >= USAGE_FULL_PERCENT) {
    return ProgressTone.Err;
  }
  return percent >= USAGE_WARN_PERCENT ? ProgressTone.Warn : ProgressTone.Accent;
};

export const formatUsageNumber = (value: number, locale: string): string =>
  new Intl.NumberFormat(locale).format(value);

export const formatUsageDay = (iso: string, locale: string): string =>
  new Intl.DateTimeFormat(locale, USAGE_DAY_FORMAT).format(new Date(iso));

export const formatUsageLastDay = (periodEndIso: string, locale: string): string =>
  formatUsageDay(new Date(Date.parse(periodEndIso) - 1).toISOString(), locale);

export const usagePeriodLabel = (
  periodStartIso: string,
  periodEndIso: string,
  locale: string,
): string =>
  `${formatUsageDay(periodStartIso, locale)} – ${formatUsageLastDay(periodEndIso, locale)}`;

const utcDayIndex = (time: number): number => Math.floor(time / MILLISECONDS_PER_DAY);

export const usageReachedWhen = (
  reachedAtIso: string | null,
  now: Date,
  locale: string,
): UsageWhen => {
  if (reachedAtIso === null) {
    return { kind: UsageWhenKind.Unknown, date: null };
  }
  const reachedAt = Date.parse(reachedAtIso);
  if (utcDayIndex(reachedAt) === utcDayIndex(now.getTime())) {
    return { kind: UsageWhenKind.Today, date: null };
  }
  return { kind: UsageWhenKind.On, date: formatUsageDay(reachedAtIso, locale) };
};
