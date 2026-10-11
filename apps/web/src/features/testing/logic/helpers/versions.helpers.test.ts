import { describe, expect, it } from 'vitest';
import { formatVersionDate, noteLines } from '@/features/testing/logic/helpers/versions.helpers';

describe('noteLines', () => {
  it('splits a release note into its non-empty lines', () => {
    expect(noteLines('Added a guard\r\n\n  Pinned the prompt  ')).toEqual([
      'Added a guard',
      'Pinned the prompt',
    ]);
  });

  it('has no lines without a note', () => {
    expect(noteLines(null)).toEqual([]);
    expect(noteLines(' \n ')).toEqual([]);
  });
});

describe('formatVersionDate', () => {
  it('writes the day and the short month in the locale', () => {
    expect(formatVersionDate('2026-09-26T10:00:00.000Z', 'en')).toBe('Sep 26');
  });
});
