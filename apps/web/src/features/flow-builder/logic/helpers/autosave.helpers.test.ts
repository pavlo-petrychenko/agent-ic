import { describe, expect, it } from 'vitest';
import { formatSavedAt } from '@/features/flow-builder/logic/helpers/autosave.helpers';

describe('formatSavedAt', () => {
  it('writes the save time as a short local time', () => {
    const iso = '2026-10-11T09:15:00.000Z';
    const expected = new Intl.DateTimeFormat('uk', { timeStyle: 'short' }).format(Date.parse(iso));

    expect(formatSavedAt(iso, 'uk')).toBe(expected);
  });
});
