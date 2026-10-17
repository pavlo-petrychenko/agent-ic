import clsx from 'clsx';
import { useTranslation } from 'react-i18next';
import { PROMPTS_NAMESPACE } from '@/features/prompts/constants/promptsI18n.constants';
import type { PromptVersionsProps } from '@/features/prompts/view/PromptVersions/PromptVersions.typedefs';
import { Text, TextColor, TextElement, TextKind } from '@/shared/ui/typography/Text';
import styles from '@/features/prompts/view/PromptVersions/PromptVersions.module.scss';

export function PromptVersions({ versions, activeId }: PromptVersionsProps) {
  const { t } = useTranslation(PROMPTS_NAMESPACE);

  return (
    <ul aria-label={t('versions.title')} className={styles.root}>
      {versions.map((version) => {
        const active = version.id === activeId;

        return (
          <li
            key={version.id}
            aria-current={active ? 'true' : undefined}
            className={clsx(styles.row, active && styles.active)}
          >
            <span className={styles.info}>
              <Text as={TextElement.Span} kind={TextKind.Mono}>
                {t('versions.number', { number: version.number })}
              </Text>
              {version.note !== null && (
                <Text
                  as={TextElement.Span}
                  kind={TextKind.Caption}
                  color={TextColor.Mute}
                  className={styles.note}
                >
                  {version.note}
                </Text>
              )}
            </span>
            <Text as={TextElement.Span} kind={TextKind.Caption} color={TextColor.Mute}>
              {version.date}
            </Text>
          </li>
        );
      })}
    </ul>
  );
}
