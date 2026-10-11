import { AGENT_NAME_MAX_LENGTH } from '@agent-ic/contracts';
import {
  AGENT_NAMES_LOCK_PREFIX,
  AGENT_NAMES_LOCK_SEPARATOR,
  DUPLICATE_AGENT_NAME_SUFFIX,
  FIRST_AGENT_NAME_NUMBER,
  NUMBERED_AGENT_NAME_SEPARATOR,
} from '@/modules/agents/constants/agent-input.constants';

export const duplicateAgentName = (name: string): string =>
  `${name.slice(0, AGENT_NAME_MAX_LENGTH - DUPLICATE_AGENT_NAME_SUFFIX.length)}${DUPLICATE_AGENT_NAME_SUFFIX}`;

const numberedAgentName = (name: string, number: number): string => {
  const suffix = `${NUMBERED_AGENT_NAME_SEPARATOR}${number}`;
  return `${name.slice(0, AGENT_NAME_MAX_LENGTH - suffix.length).trimEnd()}${suffix}`;
};

export const uniqueAgentName = (name: string, takenNames: readonly string[]): string => {
  const taken = new Set(takenNames);
  if (!taken.has(name)) {
    return name;
  }
  let number = FIRST_AGENT_NAME_NUMBER;
  while (taken.has(numberedAgentName(name, number))) {
    number += 1;
  }
  return numberedAgentName(name, number);
};

export const agentNamesLockKey = (workspaceId: string): string =>
  [AGENT_NAMES_LOCK_PREFIX, workspaceId].join(AGENT_NAMES_LOCK_SEPARATOR);
