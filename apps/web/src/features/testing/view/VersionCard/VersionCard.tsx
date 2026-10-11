import clsx from 'clsx';
import type { MouseEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { TESTING_NAMESPACE } from '@/features/testing/constants/testingI18n.constants';
import { VERSION_BADGE_TONE, VersionKind } from '@/features/testing/constants/versions.constants';
import { CARD_CONTROL_SELECTOR } from '@/features/testing/view/VersionCard/VersionCard.constants';
import type { VersionCardProps } from '@/features/testing/view/VersionCard/VersionCard.typedefs';
import { Badge } from '@/shared/ui/display/Badge';
import { BulletList } from '@/shared/ui/display/BulletList';
import { Card, CardElement, CardGap } from '@/shared/ui/display/Card';
import { Text, TextColor, TextElement, TextKind } from '@/shared/ui/typography/Text';
import styles from '@/features/testing/view/VersionCard/VersionCard.module.scss';

export function VersionCard({
  number,
  kind,
  meta,
  lines,
  selected,
  actions,
  onSelect,
}: VersionCardProps) {
  const { t } = useTranslation(TESTING_NAMESPACE);
  const name = t('versions.number', { number });
  const label = (
    <Text as={TextElement.Span} kind={TextKind.Mono}>
      {name}
    </Text>
  );

  const selectFromCard = (event: MouseEvent<HTMLElement>) => {
    const fromControl =
      event.target instanceof Element && event.target.closest(CARD_CONTROL_SELECTOR) !== null;
    if (onSelect !== null && !fromControl) {
      onSelect();
    }
  };

  return (
    <Card
      as={CardElement.Li}
      gap={CardGap.Sm}
      selected={selected}
      aria-label={name}
      className={clsx(onSelect !== null && styles.selectable)}
      onClick={selectFromCard}
    >
      <div className={styles.head}>
        {onSelect === null ? (
          label
        ) : (
          <button
            type="button"
            className={styles.select}
            aria-pressed={selected}
            onClick={onSelect}
          >
            {label}
          </button>
        )}
        <Badge tone={VERSION_BADGE_TONE[kind]} dot={kind !== VersionKind.Archived}>
          {t(`versions.kind.${kind}`)}
        </Badge>
        <Text as={TextElement.Span} kind={TextKind.Caption} color={TextColor.Mute}>
          {meta}
        </Text>
        {actions !== null && <span className={styles.actions}>{actions}</span>}
      </div>
      {lines.length > 0 && <BulletList items={lines} />}
    </Card>
  );
}
