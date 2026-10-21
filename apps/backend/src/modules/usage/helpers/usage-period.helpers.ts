import {
  USAGE_PERIOD_MONTH_DIGITS,
  USAGE_PERIOD_MONTH_PAD,
  USAGE_PERIOD_SEPARATOR,
} from '@/modules/usage/constants/usage.constants';
import type { UsagePeriod } from '@/modules/usage/typedefs/usage.typedefs';

export const usagePeriodOf = (at: Date): UsagePeriod => {
  const year = at.getUTCFullYear();
  const month = at.getUTCMonth();
  const monthNumber = String(month + 1).padStart(USAGE_PERIOD_MONTH_DIGITS, USAGE_PERIOD_MONTH_PAD);
  return {
    key: `${year}${USAGE_PERIOD_SEPARATOR}${monthNumber}`,
    start: new Date(Date.UTC(year, month)),
    end: new Date(Date.UTC(year, month + 1)),
  };
};
