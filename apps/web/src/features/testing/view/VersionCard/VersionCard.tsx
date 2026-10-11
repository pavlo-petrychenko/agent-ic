import { useTranslation } from 'react-i18next';
import { TESTING_NAMESPACE } from '@/features/testing/constants/testingI18n.constants';
import { VERSION_BADGE_TONE, VersionKind } from '@/features/testing/constants/versions.constants';
import type { VersionCardProps } from '@/features/testing/view/VersionCard/VersionCard.typedefs';
import { Badge } from '@/shared/ui/display/Badge';
import { BulletList } from '@/shared/ui/display/BulletList';
import { Card, CardElement, CardGap } from '@/shared/ui/display/Card';
import { Text, TextColor, TextElement, TextKind } from '@/shared/ui/typography/Text';
import styles from '@/features/testing/view/VersionCard/VersionCard.module.scss';

export function VersionCard({ number, kind, meta, lines, selected, actions }: VersionCardProps) {
  const { t } = useTranslation(TESTING_NAMESPACE);
  const name = t('versions.number', { number });

  return (
    <Card as={CardElement.Li} gap={CardGap.Sm} selected={selected} aria-label={name}>
      <div className={styles.head}>
        <Text as={TextElement.Span} kind={TextKind.Mono}>
          {name}
        </Text>
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
