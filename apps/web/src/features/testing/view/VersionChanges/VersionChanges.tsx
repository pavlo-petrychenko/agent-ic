import { useTranslation } from 'react-i18next';
import { TESTING_NAMESPACE } from '@/features/testing/constants/testingI18n.constants';
import type { VersionChangesProps } from '@/features/testing/view/VersionChanges/VersionChanges.typedefs';
import { Button, ButtonSize, ButtonVariant } from '@/shared/ui/actions/Button';
import { Callout, CalloutTone } from '@/shared/ui/display/Callout';
import { Card, CardTone } from '@/shared/ui/display/Card';
import { DiffLine } from '@/shared/ui/display/DiffLine';
import { Skeleton } from '@/shared/ui/display/Skeleton';
import { Divider } from '@/shared/ui/layout/Divider';
import { Heading, HeadingElement, HeadingSize } from '@/shared/ui/typography/Heading';
import { Text, TextColor, TextElement, TextKind } from '@/shared/ui/typography/Text';
import styles from '@/features/testing/view/VersionChanges/VersionChanges.module.scss';

export function VersionChanges({
  title,
  subtitle,
  changes,
  emptyText,
  loading,
  failed,
  onRetry,
}: VersionChangesProps) {
  const { t } = useTranslation(TESTING_NAMESPACE);

  const body = () => {
    if (loading) {
      return <Skeleton label={t('versions.compare.loading')} />;
    }
    if (failed) {
      return (
        <Callout
          tone={CalloutTone.Err}
          action={
            <Button variant={ButtonVariant.Secondary} size={ButtonSize.Sm} onClick={onRetry}>
              {t('retry')}
            </Button>
          }
        >
          {t('versions.compare.loadError')}
        </Callout>
      );
    }
    if (changes.length === 0) {
      return (
        <Text kind={TextKind.BodySmall} color={TextColor.Ink2}>
          {emptyText}
        </Text>
      );
    }
    return (
      <ul className={styles.changes}>
        {changes.map((change) => (
          <DiffLine key={change.id} sign={change.sign} signLabel={change.signLabel}>
            {change.text}
          </DiffLine>
        ))}
      </ul>
    );
  };

  return (
    <Card tone={CardTone.Panel} aria-label={title}>
      <div className={styles.head}>
        <Heading size={HeadingSize.H3} as={HeadingElement.H2}>
          {title}
        </Heading>
        {subtitle !== null && (
          <Text as={TextElement.Span} kind={TextKind.Caption} color={TextColor.Mute}>
            {subtitle}
          </Text>
        )}
      </div>
      {body()}
      <Divider />
      <Text kind={TextKind.Caption} color={TextColor.Mute}>
        {t('versions.footnote')}
      </Text>
    </Card>
  );
}
