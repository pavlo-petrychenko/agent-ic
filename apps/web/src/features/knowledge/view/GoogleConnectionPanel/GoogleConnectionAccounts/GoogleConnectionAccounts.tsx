import { useTranslation } from 'react-i18next';
import { KNOWLEDGE_NAMESPACE } from '@/features/knowledge/constants/knowledgeI18n.constants';
import { GoogleConnectionAccount } from '@/features/knowledge/view/GoogleConnectionPanel/GoogleConnectionAccount';
import type { GoogleConnectionAccountsProps } from '@/features/knowledge/view/GoogleConnectionPanel/GoogleConnectionAccounts/GoogleConnectionAccounts.typedefs';
import { GOOGLE_CONNECTION_SPINNER_SIZE } from '@/features/knowledge/view/GoogleConnectionPanel/GoogleConnectionPanel.constants';
import { Button, ButtonSize, ButtonVariant } from '@/shared/ui/actions/Button';
import { Callout, CalloutTone } from '@/shared/ui/display/Callout';
import { Icon, IconName } from '@/shared/ui/foundations/Icon';
import styles from '@/features/knowledge/view/GoogleConnectionPanel/GoogleConnectionAccounts/GoogleConnectionAccounts.module.scss';

export function GoogleConnectionAccounts({
  connections,
  loading,
  failed,
  starting,
  disconnectingId,
  pickingConnectionId,
  onConnect,
  onDisconnect,
  onPick,
  onRetry,
}: GoogleConnectionAccountsProps) {
  const { t } = useTranslation(KNOWLEDGE_NAMESPACE);
  const pickingDisabled = pickingConnectionId !== null;
  const disconnectDisabled = disconnectingId !== null || starting || pickingDisabled;

  if (loading) {
    return (
      <div className={styles.loading}>
        <Icon name={IconName.Spinner} size={GOOGLE_CONNECTION_SPINNER_SIZE} />
        <span>{t('add.googleConnection.checking')}</span>
      </div>
    );
  }

  if (failed) {
    return (
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
    );
  }

  if (connections.length === 0) {
    return <div className={styles.empty}>{t('add.googleConnection.empty')}</div>;
  }

  return (
    <div className={styles.accounts} aria-label={t('add.googleConnection.accountsLabel')}>
      {connections.map((connection) => (
        <GoogleConnectionAccount
          key={connection.id}
          connection={connection}
          starting={starting}
          disconnecting={disconnectingId === connection.id}
          picking={pickingConnectionId === connection.id}
          pickingDisabled={pickingDisabled}
          disconnectDisabled={disconnectDisabled}
          onConnect={onConnect}
          onDisconnect={onDisconnect}
          onPick={onPick}
        />
      ))}
    </div>
  );
}
