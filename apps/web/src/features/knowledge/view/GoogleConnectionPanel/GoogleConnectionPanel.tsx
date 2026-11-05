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
  pickingConnectionId,
  disabled,
  onConnect,
  onDisconnect,
  onPick,
  onRetry,
}: GoogleConnectionPanelProps) {
  return (
    <div className={styles.root}>
      <GoogleConnectionIntro
        hasConnections={connections.length > 0}
        starting={starting}
        picking={pickingConnectionId !== null}
        disabled={disabled}
        onConnect={onConnect}
      />
      {errorMessage !== null && <Callout tone={CalloutTone.Err}>{errorMessage}</Callout>}
      <GoogleConnectionAccounts
        connections={connections}
        loading={loading}
        failed={failed}
        starting={starting}
        disconnectingId={disconnectingId}
        pickingConnectionId={pickingConnectionId}
        disabled={disabled}
        onConnect={onConnect}
        onDisconnect={onDisconnect}
        onPick={onPick}
        onRetry={onRetry}
      />
    </div>
  );
}
