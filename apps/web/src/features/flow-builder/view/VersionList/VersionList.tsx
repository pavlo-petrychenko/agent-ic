import { useTranslation } from 'react-i18next';
import { FLOW_BUILDER_NAMESPACE } from '@/features/flow-builder/constants/flowBuilderI18n.constants';
import type { VersionListProps } from '@/features/flow-builder/view/VersionList/VersionList.typedefs';
import { Button, ButtonSize, ButtonVariant } from '@/shared/ui/actions/Button';
import { Badge, BadgeTone } from '@/shared/ui/display/Badge';
import { Card, CardElement, CardGap } from '@/shared/ui/display/Card';
import { Text, TextColor, TextElement, TextKind } from '@/shared/ui/typography/Text';
import styles from '@/features/flow-builder/view/VersionList/VersionList.module.scss';

export function VersionList({
  items,
  canRollback,
  canRestore,
  onRollback,
  onRestore,
}: VersionListProps) {
  const { t } = useTranslation(FLOW_BUILDER_NAMESPACE);

  return (
    <ul className={styles.list} aria-label={t('versions.label')}>
      {items.map((item) => {
        const name = t('versions.number', { number: item.number });
        const showRollback = canRollback && !item.live;
        const showRestore = canRestore;
        return (
          <Card key={item.id} as={CardElement.Li} gap={CardGap.Sm} aria-label={name}>
            <div className={styles.head}>
              <Text as={TextElement.Span} kind={TextKind.Mono}>
                {name}
              </Text>
              {item.live && (
                <Badge tone={BadgeTone.Ok} dot>
                  {t('versions.live')}
                </Badge>
              )}
            </div>
            <Text as={TextElement.Span} kind={TextKind.Caption} color={TextColor.Mute}>
              {item.meta}
            </Text>
            {item.note !== null && item.note !== '' && (
              <Text kind={TextKind.BodySmall} color={TextColor.Ink2} className={styles.note}>
                {item.note}
              </Text>
            )}
            {(showRollback || showRestore) && (
              <div className={styles.actions}>
                {showRollback && (
                  <Button
                    variant={ButtonVariant.Secondary}
                    size={ButtonSize.Sm}
                    onClick={() => onRollback(item.id)}
                  >
                    {t('versions.rollback.action')}
                  </Button>
                )}
                {showRestore && (
                  <Button
                    variant={ButtonVariant.Ghost}
                    size={ButtonSize.Sm}
                    onClick={() => onRestore(item.id)}
                  >
                    {t('versions.restore.action')}
                  </Button>
                )}
              </div>
            )}
          </Card>
        );
      })}
    </ul>
  );
}
