import { skipToken, useQuery, useSubscription } from '@apollo/client/react';
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { LatestUnreadNotificationDocument } from '@/features/inbox/communication/gql/query/latestUnreadNotification.generated';
import { InboxActivityDocument } from '@/features/inbox/communication/gql/subscription/inboxActivity.generated';
import { showBrowserNotification } from '@/features/inbox/communication/helpers/browserNotification.helpers';
import { useBrowserNotificationPermission } from '@/features/inbox/communication/hooks/useBrowserNotificationPermission';
import { useRefetchOnFocus } from '@/features/inbox/communication/hooks/useRefetchOnFocus';
import { INBOX_NAMESPACE } from '@/features/inbox/constants/inboxI18n.constants';

export function useBrowserNotifications(
  enabled: boolean,
  onOpen: (conversationId: string) => void,
): void {
  const { t } = useTranslation(INBOX_NAMESPACE);
  const { permission } = useBrowserNotificationPermission();
  const { data, refetch } = useQuery(LatestUnreadNotificationDocument, {
    skip: !enabled,
    fetchPolicy: 'network-only',
  });
  useSubscription(InboxActivityDocument, enabled ? { onData: () => void refetch() } : skipToken);
  useRefetchOnFocus(refetch, enabled);
  const shown = useRef(new Set<string>());
  const alert = data?.latestUnreadNotification ?? null;

  useEffect(() => {
    if (!enabled || permission !== 'granted' || alert === null || shown.current.has(alert.id)) {
      return;
    }
    shown.current.add(alert.id);
    showBrowserNotification({
      title:
        alert.customerName === null
          ? t('browser.titleFallback')
          : t('browser.title', { name: alert.customerName }),
      body: alert.reason ?? t('browser.bodyFallback'),
      tag: alert.id,
      onClick: () => onOpen(alert.conversationId),
    });
  }, [alert, enabled, onOpen, permission, t]);
}
