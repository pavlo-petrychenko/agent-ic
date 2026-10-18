import { useTranslation } from 'react-i18next';
import { PROMPTS_NAMESPACE } from '@/features/prompts/constants/promptsI18n.constants';
import type { PromptVariablesProps } from '@/features/prompts/view/PromptVariables/PromptVariables.typedefs';
import { VariableChip } from '@/shared/ui/inputs/VariableChip';
import { Text, TextColor, TextKind } from '@/shared/ui/typography/Text';
import styles from '@/features/prompts/view/PromptVariables/PromptVariables.module.scss';

export function PromptVariables({ paths }: PromptVariablesProps) {
  const { t } = useTranslation(PROMPTS_NAMESPACE);

  if (paths.length === 0) {
    return (
      <Text kind={TextKind.Caption} color={TextColor.Mute}>
        {t('details.variables.empty')}
      </Text>
    );
  }

  return (
    <ul aria-label={t('details.variables.title')} className={styles.root}>
      {paths.map((path) => (
        <li key={path} className={styles.item}>
          <VariableChip path={path} />
        </li>
      ))}
    </ul>
  );
}
