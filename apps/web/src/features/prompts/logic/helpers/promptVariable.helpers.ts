import type { TriggerVariable } from '@agent-ic/flow';
import {
  PROMPT_VARIABLE_DEFAULT_GROUP,
  PROMPT_VARIABLE_GROUP_BY_PATH,
  PROMPT_VARIABLE_GROUP_BY_ROOT,
  type PromptVariableGroup,
} from '@/features/prompts/constants/promptVariable.constants';
import { collectPromptVariables } from '@/shared/prompt/helpers/promptDocument.helpers';

export interface PromptVariableOption {
  readonly path: string;
  readonly group: PromptVariableGroup;
}

export const promptVariableGroup = (path: string): PromptVariableGroup => {
  const exact = PROMPT_VARIABLE_GROUP_BY_PATH[path];
  if (exact !== undefined) {
    return exact;
  }
  return PROMPT_VARIABLE_GROUP_BY_ROOT[path.split('.')[0] ?? path] ?? PROMPT_VARIABLE_DEFAULT_GROUP;
};

export const promptVariableOptions = (
  catalog: readonly TriggerVariable[],
  text: string,
): readonly PromptVariableOption[] => {
  const paths = new Set(catalog.map((variable) => variable.path));
  return [...paths, ...collectPromptVariables(text).filter((path) => !paths.has(path))].map(
    (path) => ({ path, group: promptVariableGroup(path) }),
  );
};
