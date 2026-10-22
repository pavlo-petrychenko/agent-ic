import {
  PROMPT_VARIABLE_CLOSE,
  PROMPT_VARIABLE_CLOSE_PATTERN,
  PROMPT_VARIABLE_OPEN,
  PROMPT_VARIABLE_OPEN_PATTERN,
  PROMPT_VARIABLE_PATH_PATTERN,
  PROMPT_VARIABLE_TOKEN_SOURCE,
} from '@flow/templates/constants/prompt.constants';
import { parseVariablePath } from '@flow/templates/helpers/path.helpers';
import { formatTemplateValue } from '@flow/templates/helpers/template.helpers';

export type PromptPathVariableNormalizer = (path: string) => string;

const ANY_TOKEN_SOURCE = `${PROMPT_VARIABLE_OPEN_PATTERN}([^{}]+)${PROMPT_VARIABLE_CLOSE_PATTERN}`;

export const normalizePathVariable = (path: string): string => path.toLowerCase();

export const collectPromptVariables = (
  text: string,
  normalize: PromptPathVariableNormalizer = normalizePathVariable,
): readonly string[] => {
  const paths = new Set<string>();
  for (const match of text.matchAll(new RegExp(PROMPT_VARIABLE_TOKEN_SOURCE, 'g'))) {
    const path = match[1];
    if (path !== undefined && PROMPT_VARIABLE_PATH_PATTERN.test(path)) {
      paths.add(normalize(path));
    }
  }
  return [...paths];
};

const renderToken = (
  inner: string,
  resolve: (path: string) => unknown,
  normalize: PromptPathVariableNormalizer,
): string => {
  const path = inner.trim();
  if (PROMPT_VARIABLE_PATH_PATTERN.test(path)) {
    return formatTemplateValue(resolve(normalize(path)));
  }
  return parseVariablePath(path) === null
    ? `${PROMPT_VARIABLE_OPEN}${inner}${PROMPT_VARIABLE_CLOSE}`
    : formatTemplateValue(resolve(path));
};

export const renderPrompt = (
  text: string,
  resolve: (path: string) => unknown,
  normalize: PromptPathVariableNormalizer = normalizePathVariable,
): string =>
  text.replace(new RegExp(ANY_TOKEN_SOURCE, 'g'), (_raw, inner: string) =>
    renderToken(inner, resolve, normalize),
  );
