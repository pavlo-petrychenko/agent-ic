import { useTranslation } from 'react-i18next';
import { KNOWLEDGE_NAMESPACE } from '@/features/knowledge/constants/knowledgeI18n.constants';
import { GoogleConnectionAccounts } from '@/features/knowledge/view/GoogleConnectionPanel/GoogleConnectionAccounts';
import { GoogleConnectionIntro } from '@/features/knowledge/view/GoogleConnectionPanel/GoogleConnectionIntro';
import type { GoogleConnectionPanelProps } from '@/features/knowledge/view/GoogleConnectionPanel/GoogleConnectionPanel.typedefs';
import { Callout, CalloutTone } from '@/shared/ui/display/Callout';
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

  return (
    <div className={styles.root}>
      <GoogleConnectionIntro
        hasConnections={connections.length > 0}
        starting={starting}
        onConnect={onConnect}
      />
      {errorMessage !== null && <Callout tone={CalloutTone.Err}>{errorMessage}</Callout>}
      <GoogleConnectionAccounts
        connections={connections}
        loading={loading}
        failed={failed}
        starting={starting}
        disconnectingId={disconnectingId}
        onConnect={onConnect}
        onDisconnect={onDisconnect}
        onRetry={onRetry}
      />
      <Callout tone={CalloutTone.Neutral}>{t('add.googleConnection.pickerSoon')}</Callout>
    </div>
  );
}
