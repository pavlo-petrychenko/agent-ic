import { describe, expect, it } from 'vitest';
import {
  formatPromptDraftTime,
  nextPromptVersionNumber,
} from '@/features/prompts/logic/helpers/promptDraft.helpers';

describe('prompt draft helpers', () => {
  it('numbers the first version when there is none', () => {
    expect(nextPromptVersionNumber(null)).toBe(1);
  });

  it('numbers the version after the latest one', () => {
    expect(nextPromptVersionNumber(4)).toBe(5);
  });

  it('formats the save time as hours and minutes', () => {
    expect(formatPromptDraftTime('2026-10-16T14:20:00.000Z', 'en')).toMatch(/\d{1,2}:\d{2}/);
  });
});
