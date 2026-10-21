import {
  USAGE_DAY_FORMAT,
  USAGE_FULL_PERCENT,
  USAGE_WARN_PERCENT,
} from '@/features/settings/constants/usage.constants';
import { ProgressTone } from '@/shared/ui/display/Progress/Progress.constants';

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

export const usagePeriod = (now: Date): { start: Date; end: Date } => {
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return { start, end };
};

export const formatUsageDay = (date: Date, locale: string): string =>
  new Intl.DateTimeFormat(locale, USAGE_DAY_FORMAT).format(date);
