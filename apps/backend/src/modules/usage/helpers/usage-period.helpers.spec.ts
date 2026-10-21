import { describe, expect, it } from 'vitest';
import { usagePeriodOf } from '@/modules/usage/helpers/usage-period.helpers';

describe('usagePeriodOf', () => {
  it('names the calendar month in UTC and spans it', () => {
    expect(usagePeriodOf(new Date('2026-10-14T09:30:00.000Z'))).toEqual({
      key: '2026-10',
      start: new Date('2026-10-01T00:00:00.000Z'),
      end: new Date('2026-11-01T00:00:00.000Z'),
    });
  });

  it('rolls December over into the next year', () => {
    expect(usagePeriodOf(new Date('2026-12-31T23:59:59.999Z'))).toEqual({
      key: '2026-12',
      start: new Date('2026-12-01T00:00:00.000Z'),
      end: new Date('2027-01-01T00:00:00.000Z'),
    });
  });

  it('uses UTC, not the local day, at the month boundary', () => {
    expect(usagePeriodOf(new Date('2026-11-01T00:00:00.000Z')).key).toBe('2026-11');
    expect(usagePeriodOf(new Date('2026-10-31T23:59:59.999Z')).key).toBe('2026-10');
  });
});
