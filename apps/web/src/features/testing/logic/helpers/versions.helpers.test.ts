import { describe, expect, it } from 'vitest';
import {
  formatVersionDate,
  noteLines,
  previousVersion,
} from '@/features/testing/logic/helpers/versions.helpers';
import type { PublishedVersion } from '@/features/testing/typedefs/versions.typedefs';

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

describe('previousVersion', () => {
  const version = (number: number): PublishedVersion => ({
    id: `ver_${String(number)}`,
    number,
    live: false,
    note: null,
    authorName: null,
    publishedAt: null,
    flow: null,
  });
  const published = [version(3), version(2), version(1)];

  it('finds the version published before the given one', () => {
    expect(previousVersion(published, 3)?.number).toBe(2);
    expect(previousVersion(published, 1)).toBeNull();
  });

  it('compares the draft with the newest published version', () => {
    expect(previousVersion(published, null)?.number).toBe(3);
    expect(previousVersion([], null)).toBeNull();
  });
});
