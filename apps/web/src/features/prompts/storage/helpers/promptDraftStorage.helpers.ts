import {
  PROMPT_DRAFT_KEY_SEPARATOR,
  PROMPT_DRAFT_STORAGE_KEY_PREFIX,
} from '@/features/prompts/constants/promptDraft.constants';
import type { PromptDraft } from '@/features/prompts/typedefs/promptDraft.typedefs';

const DRAFT_KEY_PREFIX = `${PROMPT_DRAFT_STORAGE_KEY_PREFIX}${PROMPT_DRAFT_KEY_SEPARATOR}`;

const draftKey = (promptId: string): string => `${DRAFT_KEY_PREFIX}${promptId}`;

const toPromptDraft = (value: unknown): PromptDraft | null => {
  if (typeof value !== 'object' || value === null) {
    return null;
  }
  const { text, baseVersionNumber } = value as Record<string, unknown>;
  if (typeof text !== 'string') {
    return null;
  }
  if (
    baseVersionNumber !== null &&
    baseVersionNumber !== undefined &&
    typeof baseVersionNumber !== 'number'
  ) {
    return null;
  }
  return {
    text,
    baseVersionNumber: typeof baseVersionNumber === 'number' ? baseVersionNumber : null,
  };
};

export const readPromptDraft = (promptId: string): PromptDraft | null => {
  try {
    const stored = window.localStorage.getItem(draftKey(promptId));
    return stored === null ? null : toPromptDraft(JSON.parse(stored));
  } catch {
    return null;
  }
};

export const storePromptDraft = (promptId: string, draft: PromptDraft): void => {
  try {
    window.localStorage.setItem(draftKey(promptId), JSON.stringify(draft));
  } catch {
    return;
  }
};

export const removePromptDraft = (promptId: string): void => {
  try {
    window.localStorage.removeItem(draftKey(promptId));
  } catch {
    return;
  }
};

export const readPromptDraftIds = (): string[] => {
  try {
    const ids: string[] = [];
    for (let index = 0; index < window.localStorage.length; index += 1) {
      const key = window.localStorage.key(index);
      if (key !== null && key.startsWith(DRAFT_KEY_PREFIX)) {
        ids.push(key.slice(DRAFT_KEY_PREFIX.length));
      }
    }
    return ids;
  } catch {
    return [];
  }
};
