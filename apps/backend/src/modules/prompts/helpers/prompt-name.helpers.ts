import {
  PROMPT_NAMES_LOCK_PREFIX,
  PROMPT_NAMES_LOCK_SEPARATOR,
} from '@/modules/prompts/constants/prompt.constants';

export const promptNamesLockKey = (workspaceId: string): string =>
  [PROMPT_NAMES_LOCK_PREFIX, workspaceId].join(PROMPT_NAMES_LOCK_SEPARATOR);
