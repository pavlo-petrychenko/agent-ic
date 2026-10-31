import { useTranslation } from 'react-i18next';
import { KNOWLEDGE_NAMESPACE } from '@/features/knowledge/constants/knowledgeI18n.constants';
import type { GoogleConnectionAccountProps } from '@/features/knowledge/view/GoogleConnectionPanel/GoogleConnectionAccount/GoogleConnectionAccount.typedefs';
import { GoogleConnectionAccountStatus } from '@/features/knowledge/view/GoogleConnectionPanel/GoogleConnectionAccountStatus';
import { KnowledgeConnectionStatus } from '@/shared/api/generated/schema.generated';
import { Button, ButtonSize, ButtonVariant } from '@/shared/ui/actions/Button';
import styles from '@/features/knowledge/view/GoogleConnectionPanel/GoogleConnectionAccount/GoogleConnectionAccount.module.scss';

export function GoogleConnectionAccount({
  connection,
  starting,
  disconnecting,
  picking,
  pickingDisabled,
  disconnectDisabled,
  onConnect,
  onDisconnect,
  onPick,
}: GoogleConnectionAccountProps) {
  const { t } = useTranslation(KNOWLEDGE_NAMESPACE);
  const active = connection.status === KnowledgeConnectionStatus.Active;

  return (
    <div className={styles.root}>
      <div className={styles.text}>
        <span className={styles.email}>{connection.accountEmail}</span>
        <span className={styles.meta}>
          <GoogleConnectionAccountStatus status={connection.status} />
          {!active && <span className={styles.error}>{t('add.googleConnection.errorDetail')}</span>}
        </span>
      </div>
      <div className={styles.actions}>
        {active ? (
          <Button
            size={ButtonSize.Sm}
            loading={picking}
            disabled={pickingDisabled}
            onClick={() => onPick(connection)}
          >
            {t('add.googleConnection.pickDocuments')}
          </Button>
        ) : (
          <Button
            size={ButtonSize.Sm}
            variant={ButtonVariant.Secondary}
            disabled={starting || pickingDisabled}
            onClick={onConnect}
          >
            {t('add.googleConnection.reconnect')}
          </Button>
        )}
        <Button
          size={ButtonSize.Sm}
          variant={ButtonVariant.Danger}
          loading={disconnecting}
          disabled={disconnectDisabled}
          onClick={() => onDisconnect(connection)}
        >
          {t('add.googleConnection.disconnect')}
        </Button>
      </div>
    </div>
  );
}
