import { useTranslation } from 'react-i18next';
import { PROMPTS_NAMESPACE } from '@/features/prompts/constants/promptsI18n.constants';
import type { PromptDetailsFailedProps } from '@/features/prompts/containers/PromptDetailsPanel/PromptDetailsFailed/PromptDetailsFailed.typedefs';
import { Button, ButtonSize, ButtonVariant } from '@/shared/ui/actions/Button';
import { Text, TextColor, TextKind } from '@/shared/ui/typography/Text';
import styles from '@/features/prompts/containers/PromptDetailsPanel/PromptDetailsFailed/PromptDetailsFailed.module.scss';

export function PromptDetailsFailed({ message, onRetry }: PromptDetailsFailedProps) {
  const { t } = useTranslation(PROMPTS_NAMESPACE);

  return (
    <div className={styles.failed}>
      <Text kind={TextKind.Caption} color={TextColor.Mute}>
        {message}
      </Text>
      <Button size={ButtonSize.Sm} variant={ButtonVariant.Secondary} onClick={onRetry}>
        {t('retry')}
      </Button>
    </div>
  );
}
