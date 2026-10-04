import { useTranslation } from 'react-i18next';
import { useServerStatus } from '@/features/status/communication/hooks/useServerStatus';
import { useUptimeLabel } from '@/features/status/logic/hooks/useUptimeLabel';
import { ServerStatus } from '@/features/status/view/ServerStatus';
import { useErrorMessage } from '@/shared/i18n/useErrorMessage';
import { Card } from '@/shared/ui/Card';
import styles from '@/features/status/containers/StatusPage/StatusPage.module.scss';

export function StatusPage() {
  const { t } = useTranslation();
  const { status, loading, error, retry } = useServerStatus();
  const uptimeLabel = useUptimeLabel(status === null ? null : status.uptimeSeconds);
  const toErrorMessage = useErrorMessage();

  return (
    <Card title={t('status.title')}>
      <p className={styles.description}>{t('status.description')}</p>
      <ServerStatus
        version={status === null ? null : status.version}
        uptimeLabel={uptimeLabel}
        loading={loading}
        errorMessage={error === null ? null : toErrorMessage(error)}
        onRetry={retry}
      />
    </Card>
  );
}
