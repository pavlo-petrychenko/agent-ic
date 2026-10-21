import { useMemo } from 'react';
import type { UsePromptVariablesResult } from '@/features/prompts/typedefs/promptVariable.typedefs';
import {
  collectPromptVariables,
  normalizePathVariable,
} from '@/shared/prompt/helpers/promptDocument.helpers';

export function usePromptVariables(editorText: string): UsePromptVariablesResult {
  const paths = useMemo(
    () => collectPromptVariables(editorText, normalizePathVariable),
    [editorText],
  );
  const options = useMemo(() => paths.map((path) => ({ id: path, label: path })), [paths]);

  return { options, paths };
}
