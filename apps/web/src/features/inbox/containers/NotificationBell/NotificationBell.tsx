import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMarkAllNotificationsRead } from '@/features/inbox/communication/hooks/useMarkAllNotificationsRead';
import { useMarkNotificationRead } from '@/features/inbox/communication/hooks/useMarkNotificationRead';
import { useNotifications } from '@/features/inbox/communication/hooks/useNotifications';
import { useUnreadNotificationCount } from '@/features/inbox/communication/hooks/useUnreadNotificationCount';
import { INBOX_NAMESPACE } from '@/features/inbox/constants/inboxI18n.constants';
import { notificationListItemText } from '@/features/inbox/logic/helpers/notificationList.helpers';
import type {
  NotificationBellProps,
  NotificationListRow,
} from '@/features/inbox/typedefs/notificationList.typedefs';
import { NotificationBellButton } from '@/features/inbox/view/NotificationBellButton';
import { NotificationList } from '@/features/inbox/view/NotificationList';
import { toAppError } from '@/shared/api/helpers/appError.helpers';
import { useErrorMessage } from '@/shared/i18n/hooks/useErrorMessage';
import { Popover, PopoverAlign } from '@/shared/ui/overlays/Popover';
import { ToastTone, useToast } from '@/shared/ui/overlays/Toast';

export function NotificationBell({ enabled, onOpenConversation }: NotificationBellProps) {
  const { t } = useTranslation(INBOX_NAMESPACE);
  const [open, setOpen] = useState(false);
  const { items, loading, refetch: refetchList } = useNotifications(enabled && open);
  const { count, refetch: refetchCount } = useUnreadNotificationCount(enabled);
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const [markingAll, setMarkingAll] = useState(false);
  const { showToast } = useToast();
  const errorMessage = useErrorMessage();

  const refresh = useCallback(() => {
    void refetchList();
    void refetchCount();
  }, [refetchCount, refetchList]);

  if (!enabled) {
    return null;
  }

  const rows: readonly NotificationListRow[] = items.map((item) => {
    const text = notificationListItemText(item, t);
    return {
      id: item.id,
      conversationId: item.conversationId,
      title: text.title,
      subtitle: text.subtitle,
      meta: text.meta,
      read: item.read,
    };
  });

  const onOpenChange = (next: boolean) => {
    setOpen(next);
    if (next) {
      refresh();
    }
  };

  const openRow = (row: NotificationListRow) => {
    setOpen(false);
    onOpenConversation(row.conversationId);
    if (!row.read) {
      void markRead(row.id)
        .then(refresh)
        .catch((error: unknown) => {
          showToast({ message: errorMessage(toAppError(error)), tone: ToastTone.Err });
        });
    }
  };

  const markAll = () => {
    setMarkingAll(true);
    void markAllRead()
      .then(refresh)
      .catch((error: unknown) => {
        showToast({ message: errorMessage(toAppError(error)), tone: ToastTone.Err });
      })
      .finally(() => setMarkingAll(false));
  };

  return (
    <Popover
      open={open}
      onOpenChange={onOpenChange}
      align={PopoverAlign.End}
      ariaLabel={t('notifications.title')}
      trigger={<NotificationBellButton count={count} label={t('notifications.bell')} />}
    >
      <NotificationList
        rows={rows}
        loading={loading}
        markingAll={markingAll}
        markAllDisabled={count === 0}
        onOpen={openRow}
        onMarkAll={markAll}
      />
    </Popover>
  );
}
