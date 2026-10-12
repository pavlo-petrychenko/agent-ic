import {
  PROMPT_FOLDER_NAMES_LOCK_PREFIX,
  PROMPT_FOLDER_NAMES_LOCK_SEPARATOR,
} from '@/modules/prompts/constants/prompt-folder.constants';

export const promptFolderNamesLockKey = (workspaceId: string): string =>
  [PROMPT_FOLDER_NAMES_LOCK_PREFIX, workspaceId].join(PROMPT_FOLDER_NAMES_LOCK_SEPARATOR);
