import { KNOWLEDGE_BASE_NAME_MAX_LENGTH } from '@agent-ic/contracts';
import { NUMBERED_KNOWLEDGE_BASE_NAME_SEPARATOR } from '@/modules/knowledge/constants/knowledge-input.constants';

export const knowledgeNamesLockKey = (workspaceId: string): string =>
  `knowledge-base-names:${workspaceId}`;

export const numberedKnowledgeBaseName = (name: string, number: number): string => {
  const suffix = `${NUMBERED_KNOWLEDGE_BASE_NAME_SEPARATOR}${number}`;
  return `${name.slice(0, KNOWLEDGE_BASE_NAME_MAX_LENGTH - suffix.length).trimEnd()}${suffix}`;
};
