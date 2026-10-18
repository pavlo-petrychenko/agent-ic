import { describe, expect, it } from 'vitest';
import { nextPromptVersionNumber } from '@/features/prompts/logic/helpers/promptDraft.helpers';

describe('prompt draft helpers', () => {
  it('numbers the first version when there is none', () => {
    expect(nextPromptVersionNumber(null)).toBe(1);
  });

  it('numbers the version after the latest one', () => {
    expect(nextPromptVersionNumber(4)).toBe(5);
  });
});
