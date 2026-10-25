import {
  KNOWLEDGE_TOOL_NAME_FALLBACK,
  KNOWLEDGE_TOOL_NAME_MAX_LENGTH,
  KNOWLEDGE_TOOL_NAME_PREFIX,
  KNOWLEDGE_TOOL_NAME_SEPARATOR,
} from '@/modules/knowledge/constants/knowledge-tool-name.constants';

const DIACRITICS_PATTERN = /[\u0300-\u036f]/g;
const NON_ALPHANUMERIC_PATTERN = /[^a-z0-9]+/g;
const EDGE_SEPARATORS_PATTERN = /^_+|_+$/g;
const NON_ALPHANUMERIC_CHARACTER_PATTERN = /[^a-z0-9]/g;

const clipToolName = (value: string): string =>
  value.slice(0, KNOWLEDGE_TOOL_NAME_MAX_LENGTH).replace(EDGE_SEPARATORS_PATTERN, '');

const toolSlug = (name: string): string => {
  const slug = name
    .normalize('NFKD')
    .replace(DIACRITICS_PATTERN, '')
    .toLowerCase()
    .replace(NON_ALPHANUMERIC_PATTERN, KNOWLEDGE_TOOL_NAME_SEPARATOR)
    .replace(EDGE_SEPARATORS_PATTERN, '');
  return slug.length === 0 ? KNOWLEDGE_TOOL_NAME_FALLBACK : slug;
};

export const knowledgeToolNameBase = (name: string): string =>
  clipToolName(`${KNOWLEDGE_TOOL_NAME_PREFIX}${KNOWLEDGE_TOOL_NAME_SEPARATOR}${toolSlug(name)}`);

export const knowledgeToolNameWithSuffix = (base: string, suffix: string): string => {
  const cleanSuffix = suffix.replace(NON_ALPHANUMERIC_CHARACTER_PATTERN, '');
  const available = KNOWLEDGE_TOOL_NAME_MAX_LENGTH - cleanSuffix.length - 1;
  return clipToolName(`${base.slice(0, available)}${KNOWLEDGE_TOOL_NAME_SEPARATOR}${cleanSuffix}`);
};
