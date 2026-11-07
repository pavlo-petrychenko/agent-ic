import { skipToken, useQuery, useSubscription } from '@apollo/client/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LatestUnreadNotificationDocument } from '@/features/inbox/communication/gql/query/latestUnreadNotification.generated';
import { InboxActivityDocument } from '@/features/inbox/communication/gql/subscription/inboxActivity.generated';
import { showBrowserNotification } from '@/features/inbox/communication/helpers/browserNotification.helpers';
import { useBrowserNotificationPermission } from '@/features/inbox/communication/hooks/useBrowserNotificationPermission';
import { useRefetchOnFocus } from '@/features/inbox/communication/hooks/useRefetchOnFocus';
import { INBOX_NAMESPACE } from '@/features/inbox/constants/inboxI18n.constants';
import type {
  BrowserNotificationAlert,
  UseBrowserNotificationsResult,
} from '@/features/inbox/typedefs/browserNotification.typedefs';

export function useBrowserNotifications(
  enabled: boolean,
  onOpen: (conversationId: string) => void,
): UseBrowserNotificationsResult {
  const { t } = useTranslation(INBOX_NAMESPACE);
  const { permission } = useBrowserNotificationPermission();
  const { data, refetch } = useQuery(LatestUnreadNotificationDocument, {
    skip: !enabled,
    fetchPolicy: 'network-only',
  });
  useSubscription(InboxActivityDocument, enabled ? { onData: () => void refetch() } : skipToken);
  useRefetchOnFocus(refetch, enabled);
  const nativeShown = useRef(new Set<string>());
  const [dismissed, setDismissed] = useState<ReadonlySet<string>>(() => new Set());
  const [visible, setVisible] = useState(() => document.visibilityState === 'visible');
  const alert: BrowserNotificationAlert | null = data?.latestUnreadNotification ?? null;
  const cardAlert = enabled && visible && alert !== null && !dismissed.has(alert.id) ? alert : null;

  useEffect(() => {
    const update = () => setVisible(document.visibilityState === 'visible');
    document.addEventListener('visibilitychange', update);
    return () => document.removeEventListener('visibilitychange', update);
  }, []);

  useEffect(() => {
    if (
      !enabled ||
      visible ||
      alert === null ||
      permission !== 'granted' ||
      nativeShown.current.has(alert.id)
    ) {
      return;
    }
    nativeShown.current.add(alert.id);
    showBrowserNotification({
      title:
        alert.customerName === null
          ? t('browser.titleFallback')
          : t('browser.title', { name: alert.customerName }),
      body: alert.reason ?? t('browser.bodyFallback'),
      tag: alert.id,
      onClick: () => {
        setDismissed((current) => new Set(current).add(alert.id));
        onOpen(alert.conversationId);
      },
    });
  }, [alert, enabled, onOpen, permission, t, visible]);

  const dismiss = useCallback(() => {
    if (alert === null) {
      return;
    }
    setDismissed((current) => {
      if (current.has(alert.id)) {
        return current;
      }
      const next = new Set(current);
      next.add(alert.id);
      return next;
    });
  }, [alert]);

  return { cardAlert, dismiss };
}
