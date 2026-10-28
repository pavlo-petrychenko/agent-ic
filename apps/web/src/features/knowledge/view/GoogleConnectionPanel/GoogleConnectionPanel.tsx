import { useTranslation } from 'react-i18next';
import { KNOWLEDGE_NAMESPACE } from '@/features/knowledge/constants/knowledgeI18n.constants';
import {
  GOOGLE_CONNECTION_ICON_SIZE,
  GOOGLE_CONNECTION_SPINNER_SIZE,
  GOOGLE_CONNECTION_STATUS_TONES,
} from '@/features/knowledge/view/GoogleConnectionPanel/GoogleConnectionPanel.constants';
import type { GoogleConnectionPanelProps } from '@/features/knowledge/view/GoogleConnectionPanel/GoogleConnectionPanel.typedefs';
import { KnowledgeConnectionStatus } from '@/shared/api/generated/schema.generated';
import { Button, ButtonSize, ButtonVariant } from '@/shared/ui/actions/Button';
import { Badge } from '@/shared/ui/display/Badge';
import { Callout, CalloutTone } from '@/shared/ui/display/Callout';
import { Icon, IconName } from '@/shared/ui/foundations/Icon';
import styles from '@/features/knowledge/view/GoogleConnectionPanel/GoogleConnectionPanel.module.scss';

export function GoogleConnectionPanel({
  connections,
  loading,
  failed,
  errorMessage,
  starting,
  disconnectingId,
  onConnect,
  onDisconnect,
  onRetry,
}: GoogleConnectionPanelProps) {
  const { t } = useTranslation(KNOWLEDGE_NAMESPACE);

  const statusLabel = (status: KnowledgeConnectionStatus): string => {
    switch (status) {
      case KnowledgeConnectionStatus.Active:
        return t('add.googleConnection.statusActive');
      case KnowledgeConnectionStatus.Revoked:
        return t('add.googleConnection.statusRevoked');
      case KnowledgeConnectionStatus.Error:
        return t('add.googleConnection.statusError');
    }
  };

  return (
    <div className={styles.root}>
      <div className={styles.intro}>
        <span className={styles.icon}>
          <Icon name={IconName.Note} size={GOOGLE_CONNECTION_ICON_SIZE} />
        </span>
        <div className={styles.introText}>
          <span className={styles.title}>{t('add.googleConnection.title')}</span>
          <span className={styles.description}>{t('add.googleConnection.description')}</span>
        </div>
        <Button onClick={onConnect} loading={starting}>
          {connections.length === 0
            ? t('add.googleConnection.connect')
            : t('add.googleConnection.connectAnother')}
        </Button>
      </div>
      {errorMessage === null ? null : <Callout tone={CalloutTone.Err}>{errorMessage}</Callout>}
      {loading ? (
        <div className={styles.loading}>
          <Icon name={IconName.Spinner} size={GOOGLE_CONNECTION_SPINNER_SIZE} />
          <span>{t('add.googleConnection.checking')}</span>
        </div>
      ) : failed ? (
        <Callout
          tone={CalloutTone.Err}
          action={
            <Button size={ButtonSize.Sm} variant={ButtonVariant.Secondary} onClick={onRetry}>
              {t('retry')}
            </Button>
          }
        >
          {t('add.googleConnection.loadError')}
        </Callout>
      ) : connections.length === 0 ? (
        <div className={styles.empty}>{t('add.googleConnection.empty')}</div>
      ) : (
        <div className={styles.accounts} aria-label={t('add.googleConnection.accountsLabel')}>
          {connections.map((connection) => {
            const active = connection.status === KnowledgeConnectionStatus.Active;
            return (
              <div key={connection.id} className={styles.account}>
                <div className={styles.accountText}>
                  <span className={styles.email}>{connection.accountEmail}</span>
                  <span className={styles.accountMeta}>
                    <Badge tone={GOOGLE_CONNECTION_STATUS_TONES[connection.status]} dot>
                      {statusLabel(connection.status)}
                    </Badge>
                    {active ? null : (
                      <span className={styles.accountError}>
                        {t('add.googleConnection.errorDetail')}
                      </span>
                    )}
                  </span>
                </div>
                <div className={styles.actions}>
                  {active ? null : (
                    <Button
                      size={ButtonSize.Sm}
                      variant={ButtonVariant.Secondary}
                      disabled={starting}
                      onClick={onConnect}
                    >
                      {t('add.googleConnection.reconnect')}
                    </Button>
                  )}
                  <Button
                    size={ButtonSize.Sm}
                    variant={ButtonVariant.Danger}
                    loading={disconnectingId === connection.id}
                    disabled={disconnectingId !== null || starting}
                    onClick={() => onDisconnect(connection)}
                  >
                    {t('add.googleConnection.disconnect')}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
      <Callout tone={CalloutTone.Neutral}>{t('add.googleConnection.pickerSoon')}</Callout>
    </div>
  );
}
