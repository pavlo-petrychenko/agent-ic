import { beforeEach, describe, expect, it } from 'vitest';
import {
  PROMPT_DRAFT_KEY_SEPARATOR,
  PROMPT_DRAFT_STORAGE_KEY_PREFIX,
} from '@/features/prompts/constants/promptDraft.constants';
import {
  readPromptDraft,
  readPromptDraftIds,
  removePromptDraft,
  storePromptDraft,
} from '@/features/prompts/storage/helpers/promptDraftStorage.helpers';

const DRAFT = {
  text: 'Hello {{contact.name}}',
  baseVersionNumber: 4,
};

describe('prompt draft storage', () => {
  beforeEach(() => window.localStorage.clear());

  it('round-trips a draft', () => {
    storePromptDraft('prm_1', DRAFT);

    expect(readPromptDraft('prm_1')).toEqual(DRAFT);
  });

  it('reads null for an unknown prompt', () => {
    expect(readPromptDraft('prm_missing')).toBeNull();
  });

  it('reads null for a corrupted entry', () => {
    window.localStorage.setItem(
      `${PROMPT_DRAFT_STORAGE_KEY_PREFIX}${PROMPT_DRAFT_KEY_SEPARATOR}prm_1`,
      'not json',
    );

    expect(readPromptDraft('prm_1')).toBeNull();
  });

  it('reads null for a draft with a wrong shape', () => {
    window.localStorage.setItem(
      `${PROMPT_DRAFT_STORAGE_KEY_PREFIX}${PROMPT_DRAFT_KEY_SEPARATOR}prm_1`,
      JSON.stringify({ text: 7 }),
    );

    expect(readPromptDraft('prm_1')).toBeNull();
  });

  it('lists stored prompt ids', () => {
    storePromptDraft('prm_1', DRAFT);
    storePromptDraft('prm_2', { ...DRAFT, baseVersionNumber: null });

    expect(readPromptDraftIds().sort()).toEqual(['prm_1', 'prm_2']);
  });

  it('removes a draft', () => {
    storePromptDraft('prm_1', DRAFT);
    removePromptDraft('prm_1');

    expect(readPromptDraft('prm_1')).toBeNull();
  });
});
