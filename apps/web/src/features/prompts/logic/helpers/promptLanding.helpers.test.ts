import { describe, expect, it } from 'vitest';
import { resolveLandingPromptId } from '@/features/prompts/logic/helpers/promptLanding.helpers';
import type { PromptListItem } from '@/features/prompts/typedefs/prompt.typedefs';

const prompt = (id: string, updatedAt: string): PromptListItem => ({
  id,
  name: id,
  folderId: 'pfl_1',
  latestVersionNumber: null,
  updatedAt,
});

describe('prompt landing', () => {
  it('returns null for an empty library', () => {
    expect(resolveLandingPromptId([], 'prm_1')).toBeNull();
  });

  it('keeps the last opened prompt', () => {
    const prompts = [
      prompt('prm_old', '2026-01-01T00:00:00.000Z'),
      prompt('prm_new', '2026-10-01T00:00:00.000Z'),
    ];

    expect(resolveLandingPromptId(prompts, 'prm_old')).toBe('prm_old');
  });

  it('falls back to the most recently updated prompt', () => {
    const prompts = [
      prompt('prm_a', '2026-10-01T00:00:00.000Z'),
      prompt('prm_b', '2026-10-05T00:00:00.000Z'),
      prompt('prm_c', '2026-09-30T00:00:00.000Z'),
    ];

    expect(resolveLandingPromptId(prompts, 'prm_gone')).toBe('prm_b');
  });

  it('falls back when nothing was opened yet', () => {
    const prompts = [prompt('prm_a', '2026-10-01T00:00:00.000Z')];

    expect(resolveLandingPromptId(prompts, null)).toBe('prm_a');
  });
});
