import { useTranslation } from 'react-i18next';
import { PROMPTS_NAMESPACE } from '@/features/prompts/constants/promptsI18n.constants';
import { PromptDetailsSection } from '@/features/prompts/containers/PromptDetailsPanel/PromptDetailsSection';
import type { PromptVariablesSectionProps } from '@/features/prompts/containers/PromptDetailsPanel/PromptVariablesSection/PromptVariablesSection.typedefs';
import { PromptVariables } from '@/features/prompts/view/PromptVariables';

export function PromptVariablesSection({ paths }: PromptVariablesSectionProps) {
  const { t } = useTranslation(PROMPTS_NAMESPACE);

  return (
    <PromptDetailsSection title={t('details.variables.title')} action={null}>
      <PromptVariables paths={paths} />
    </PromptDetailsSection>
  );
}
