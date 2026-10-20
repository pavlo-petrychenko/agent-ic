import {
  PROMPT_VARIABLE_TOKEN_SOURCE,
  PROMPT_VARIABLE_PATH_PATTERN,
} from '@flow/templates/constants/prompt.constants';
import { formatTemplateValue } from '@flow/templates/helpers/template.helpers';

export type PromptPathVariableNormalizer = (path: string) => string;

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

export const renderPrompt = (
  text: string,
  resolve: (path: string) => unknown,
  normalize: PromptPathVariableNormalizer = normalizePathVariable,
): string =>
  text.replace(new RegExp(PROMPT_VARIABLE_TOKEN_SOURCE, 'g'), (_raw, path: string) =>
    formatTemplateValue(resolve(normalize(path))),
  );
