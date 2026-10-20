import {
  PROMPT_LAST_OPENED_KEY_SEPARATOR,
  PROMPT_LAST_OPENED_STORAGE_KEY_PREFIX,
} from '@/features/prompts/constants/promptLastOpened.constants';

const lastOpenedKey = (workspaceId: string): string =>
  `${PROMPT_LAST_OPENED_STORAGE_KEY_PREFIX}${PROMPT_LAST_OPENED_KEY_SEPARATOR}${workspaceId}`;

export const readLastOpenedPromptId = (workspaceId: string): string | null => {
  try {
    const stored = window.localStorage.getItem(lastOpenedKey(workspaceId));
    return stored === null || stored === '' ? null : stored;
  } catch {
    return null;
  }
};

export const storeLastOpenedPromptId = (workspaceId: string, promptId: string): void => {
  try {
    window.localStorage.setItem(lastOpenedKey(workspaceId), promptId);
  } catch {
    return;
  }
};
