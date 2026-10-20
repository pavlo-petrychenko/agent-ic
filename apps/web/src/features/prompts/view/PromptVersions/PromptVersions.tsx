import clsx from 'clsx';
import { useTranslation } from 'react-i18next';
import { PROMPTS_NAMESPACE } from '@/features/prompts/constants/promptsI18n.constants';
import type {
  PromptVersionRow,
  PromptVersionsProps,
} from '@/features/prompts/view/PromptVersions/PromptVersions.typedefs';
import { Text, TextColor, TextElement, TextKind } from '@/shared/ui/typography/Text';
import styles from '@/features/prompts/view/PromptVersions/PromptVersions.module.scss';

export function PromptVersions({ versions, activeId, onSelect }: PromptVersionsProps) {
  const { t } = useTranslation(PROMPTS_NAMESPACE);

  const content = (version: PromptVersionRow) => (
    <>
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
    </>
  );

  return (
    <ul aria-label={t('versions.title')} className={styles.root}>
      {versions.map((version) => {
        const active = version.id === activeId;
        const selectable = onSelect !== null && !active;

        return (
          <li
            key={version.id}
            aria-current={active ? 'true' : undefined}
            className={clsx(styles.item, active && styles.active)}
          >
            {selectable ? (
              <button
                type="button"
                aria-label={t('versions.open', { number: version.number })}
                className={clsx(styles.row, styles.interactive)}
                onClick={() => onSelect(version.id)}
              >
                {content(version)}
              </button>
            ) : (
              <div className={styles.row}>{content(version)}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
