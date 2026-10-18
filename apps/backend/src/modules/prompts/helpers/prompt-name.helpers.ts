import { PROMPT_NAME_MAX_LENGTH } from '@agent-ic/contracts';
import {
  DUPLICATE_PROMPT_NAME_SUFFIX,
  NUMBERED_PROMPT_NAME_SEPARATOR,
  PROMPT_NAMES_LOCK_PREFIX,
  PROMPT_NAMES_LOCK_SEPARATOR,
} from '@/modules/prompts/constants/prompt.constants';

export const duplicatePromptName = (name: string): string =>
  `${name.slice(0, PROMPT_NAME_MAX_LENGTH - DUPLICATE_PROMPT_NAME_SUFFIX.length)}${DUPLICATE_PROMPT_NAME_SUFFIX}`;

export const numberedPromptName = (name: string, number: number): string => {
  const suffix = `${NUMBERED_PROMPT_NAME_SEPARATOR}${number}`;
  return `${name.slice(0, PROMPT_NAME_MAX_LENGTH - suffix.length).trimEnd()}${suffix}`;
};

export const importedPromptName = (agentName: string, nodeLabel: string): string =>
  `${agentName} · ${nodeLabel}`.slice(0, PROMPT_NAME_MAX_LENGTH).trimEnd();

export const promptNamesLockKey = (workspaceId: string): string =>
  [PROMPT_NAMES_LOCK_PREFIX, workspaceId].join(PROMPT_NAMES_LOCK_SEPARATOR);
