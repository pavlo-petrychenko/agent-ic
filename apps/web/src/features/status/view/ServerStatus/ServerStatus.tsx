import { useTranslation } from 'react-i18next';
import type { ServerStatusProps } from '@/features/status/view/ServerStatus/ServerStatus.typedefs';
import { Button, ButtonVariant } from '@/shared/ui/actions/Button';
import styles from '@/features/status/view/ServerStatus/ServerStatus.module.scss';

export function ServerStatus({
  version,
  uptimeLabel,
  loading,
  errorMessage,
  onRetry,
}: ServerStatusProps) {
  const { t } = useTranslation();
  const hasStatus = version !== null && uptimeLabel !== null;

  return (
    <div className={styles.root}>
      {loading && !hasStatus ? (
        <output className={styles.muted}>{t('status.loading')}</output>
      ) : null}
      {hasStatus ? (
        <dl className={styles.list}>
          <div className={styles.row}>
            <dt className={styles.term}>{t('status.version')}</dt>
            <dd className={styles.version}>{version}</dd>
          </div>
          <div className={styles.row}>
            <dt className={styles.term}>{t('status.uptime')}</dt>
            <dd className={styles.value}>{uptimeLabel}</dd>
          </div>
        </dl>
      ) : null}
      {errorMessage === null ? null : (
        <div role="alert" className={styles.error}>
          <p>{errorMessage}</p>
          <Button variant={ButtonVariant.Secondary} onClick={onRetry}>
            {t('status.retry')}
          </Button>
        </div>
      )}
    </div>
  );
}
