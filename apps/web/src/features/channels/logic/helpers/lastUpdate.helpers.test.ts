import { describe, expect, it } from 'vitest';
import { lastUpdateLabel } from '@/features/channels/logic/helpers/lastUpdate.helpers';
import { LastUpdateKind } from '@/features/channels/typedefs/lastUpdate.typedefs';

describe('lastUpdateLabel', () => {
  it('keeps only the time when the update happened today', () => {
    const now = new Date(2026, 9, 26, 18, 0);
    const iso = new Date(2026, 9, 26, 9, 5).toISOString();

    const label = lastUpdateLabel(iso, now, 'en');

    expect(label.kind).toBe(LastUpdateKind.Today);
    expect(label.date).toBeNull();
    expect(label.time).toMatch(/\d{2}:\d{2}/);
  });

  it('adds the day when the update happened earlier', () => {
    const now = new Date(2026, 9, 26, 18, 0);
    const iso = new Date(2026, 9, 24, 14, 21).toISOString();

    const label = lastUpdateLabel(iso, now, 'en');

    expect(label.kind).toBe(LastUpdateKind.Earlier);
    expect(label.date).toBe('Oct 24');
    expect(label.time).toMatch(/\d{2}:\d{2}/);
  });
});
