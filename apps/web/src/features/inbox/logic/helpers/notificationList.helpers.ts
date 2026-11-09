import { inboxUpdatedLabel } from '@/features/inbox/logic/helpers/inboxList.helpers';
import type { InboxTranslate } from '@/features/inbox/typedefs/common.typedefs';
import type {
  NotificationListItem,
  NotificationListItemText,
} from '@/features/inbox/typedefs/notificationList.typedefs';

export const notificationListItemText = (
  item: NotificationListItem,
  t: InboxTranslate,
): NotificationListItemText => {
  const reminder = item.kind === 'reminder';
  const title =
    item.customerName === null
      ? reminder
        ? t('browser.reminderTitleFallback', { minutes: item.waitingMinutes })
        : t('browser.titleFallback')
      : reminder
        ? t('browser.reminderTitle', {
            name: item.customerName,
            minutes: item.waitingMinutes,
          })
        : t('browser.title', { name: item.customerName });
  return {
    title,
    subtitle: item.reason ?? (reminder ? t('browser.reminderBody') : t('browser.bodyFallback')),
    meta: `${reminder ? t('notifications.kindReminder') : t('notifications.kindEscalation')} · ${inboxUpdatedLabel(Math.max(1, item.minutesAgo), t)}`,
  };
};
