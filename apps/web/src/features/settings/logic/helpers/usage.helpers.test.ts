import { describe, expect, it } from 'vitest';
import {
  formatUsageDay,
  formatUsageLastDay,
  usagePercent,
  usagePeriodLabel,
  usageReachedWhen,
  usageTone,
} from '@/features/settings/logic/helpers/usage.helpers';
import { UsageWhenKind } from '@/features/settings/typedefs/usage.typedefs';
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

  it('formats a UTC day', () => {
    expect(formatUsageDay('2026-10-01T00:00:00.000Z', 'en')).toBe('Oct 1');
    expect(formatUsageDay('2026-10-31T23:59:59.000Z', 'en')).toBe('Oct 31');
  });

  it('shows the last day of the period from the exclusive end', () => {
    expect(formatUsageLastDay('2026-11-01T00:00:00.000Z', 'en')).toBe('Oct 31');
    expect(formatUsageLastDay('2027-03-01T00:00:00.000Z', 'en')).toBe('Feb 28');
    expect(formatUsageLastDay('2027-01-01T00:00:00.000Z', 'en')).toBe('Dec 31');
  });

  it('builds the period label', () => {
    expect(usagePeriodLabel('2026-10-01T00:00:00.000Z', '2026-11-01T00:00:00.000Z', 'en')).toBe(
      'Oct 1 – Oct 31',
    );
  });

  it('says today when the limit was reached on the current UTC day', () => {
    const now = new Date('2026-10-12T18:00:00.000Z');
    expect(usageReachedWhen('2026-10-12T01:00:00.000Z', now, 'en')).toEqual({
      kind: UsageWhenKind.Today,
      date: null,
    });
  });

  it('gives the date when the limit was reached on an earlier day', () => {
    const now = new Date('2026-10-12T18:00:00.000Z');
    expect(usageReachedWhen('2026-10-09T23:59:00.000Z', now, 'en')).toEqual({
      kind: UsageWhenKind.On,
      date: 'Oct 9',
    });
  });

  it('gives no date when the reach time is unknown', () => {
    expect(usageReachedWhen(null, new Date('2026-10-12T18:00:00.000Z'), 'en')).toEqual({
      kind: UsageWhenKind.Unknown,
      date: null,
    });
  });
});
