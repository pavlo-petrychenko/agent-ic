import { useTranslation } from 'react-i18next';
import { minutesAgo } from '@/features/inbox/communication/helpers/inboxFormat.helpers';
import { useBrowserNotifications } from '@/features/inbox/communication/hooks/useBrowserNotifications';
import { useMarkNotificationsRead } from '@/features/inbox/communication/hooks/useMarkNotificationsRead';
import { INBOX_NAMESPACE } from '@/features/inbox/constants/inboxI18n.constants';
import type { InboxBrowserNotificationsProps } from '@/features/inbox/containers/InboxBrowserNotifications/InboxBrowserNotifications.typedefs';
import { inboxNotificationCardText } from '@/features/inbox/logic/helpers/browserNotification.helpers';
import { InboxNotificationCard } from '@/features/inbox/view/InboxNotificationCard';
import { toAppError } from '@/shared/api/helpers/appError.helpers';
import { useErrorMessage } from '@/shared/i18n/hooks/useErrorMessage';
import { ToastTone, useToast } from '@/shared/ui/overlays/Toast';

export function InboxBrowserNotifications({ enabled, onOpen }: InboxBrowserNotificationsProps) {
  const { t } = useTranslation(INBOX_NAMESPACE);
  const { cardAlert, dismiss } = useBrowserNotifications(enabled, onOpen);
  const markNotificationsRead = useMarkNotificationsRead();
  const { showToast } = useToast();
  const errorMessage = useErrorMessage();

  if (cardAlert === null) {
    return null;
  }

  return (
    <InboxNotificationCard
      {...inboxNotificationCardText(
        cardAlert.customerName,
        cardAlert.channelKind,
        minutesAgo(cardAlert.createdAt),
        t,
      )}
      onOpen={() => {
        dismiss();
        onOpen(cardAlert.conversationId);
      }}
      onClose={() => {
        dismiss();
        void markNotificationsRead(cardAlert.conversationId).catch((error: unknown) => {
          showToast({ message: errorMessage(toAppError(error)), tone: ToastTone.Err });
        });
      }}
    />
  );
}
