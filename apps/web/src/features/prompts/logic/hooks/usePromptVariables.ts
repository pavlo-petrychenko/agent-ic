import { libraryVariables } from '@agent-ic/flow';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { PROMPTS_NAMESPACE } from '@/features/prompts/constants/promptsI18n.constants';
import { promptVariableOptions } from '@/features/prompts/logic/helpers/promptVariable.helpers';
import type { UsePromptVariablesResult } from '@/features/prompts/typedefs/promptVariable.typedefs';
import { collectPromptVariables } from '@/shared/prompt/helpers/promptDocument.helpers';

export function usePromptVariables(editorText: string): UsePromptVariablesResult {
  const { t } = useTranslation(PROMPTS_NAMESPACE);

  const options = useMemo(
    () =>
      promptVariableOptions(libraryVariables(), editorText).map((option) => ({
        id: option.path,
        label: option.path,
        group: t(`view.variableGroups.${option.group}`),
      })),
    [editorText, t],
  );
  const paths = useMemo(() => collectPromptVariables(editorText), [editorText]);

  return { options, paths };
}
