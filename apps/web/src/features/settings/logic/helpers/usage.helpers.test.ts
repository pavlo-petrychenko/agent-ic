import { describe, expect, it } from 'vitest';
import {
  formatUsageDay,
  usagePercent,
  usagePeriod,
  usageTone,
} from '@/features/settings/logic/helpers/usage.helpers';
import { ProgressTone } from '@/shared/ui/display/Progress/Progress.constants';

describe('usage helpers', () => {
  it('rounds the used share of the limit', () => {
    expect(usagePercent(7200, 10000)).toBe(72);
    expect(usagePercent(4190, 10000)).toBe(42);
    expect(usagePercent(0, 10000)).toBe(0);
    expect(usagePercent(10500, 10000)).toBe(100);
    expect(usagePercent(10, 0)).toBe(0);
  });

  it('warns from 80 and errors at 100', () => {
    expect(usageTone(79)).toBe(ProgressTone.Accent);
    expect(usageTone(80)).toBe(ProgressTone.Warn);
    expect(usageTone(99)).toBe(ProgressTone.Warn);
    expect(usageTone(100)).toBe(ProgressTone.Err);
  });

  it('takes the first and the last day of the month of the given date', () => {
    const { start, end } = usagePeriod(new Date(2026, 9, 15));
    expect(formatUsageDay(start, 'en')).toBe('Oct 1');
    expect(formatUsageDay(end, 'en')).toBe('Oct 31');
  });

  it('keeps short months and the year boundary local', () => {
    expect(formatUsageDay(usagePeriod(new Date(2027, 1, 8)).end, 'en')).toBe('Feb 28');
    expect(formatUsageDay(usagePeriod(new Date(2026, 11, 31)).start, 'en')).toBe('Dec 1');
    expect(formatUsageDay(usagePeriod(new Date(2026, 11, 31)).end, 'en')).toBe('Dec 31');
  });
});
