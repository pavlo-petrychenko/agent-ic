import { inboxUpdatedLabel } from '@/features/inbox/logic/helpers/inboxList.helpers';
import type { InboxNotificationCardText } from '@/features/inbox/typedefs/browserNotification.typedefs';
import type { BrowserNotificationAlert } from '@/features/inbox/typedefs/browserNotification.typedefs';
import type { InboxTranslate } from '@/features/inbox/typedefs/common.typedefs';

const channelLabel = (channelKind: string | null, t: InboxTranslate): string => {
  if (channelKind === 'telegram') {
    return t('provider.telegram');
  }
  if (channelKind === 'api') {
    return t('provider.api');
  }
  return t('provider.other');
};

const titleOf = (alert: BrowserNotificationAlert, t: InboxTranslate): string => {
  if (alert.kind === 'reminder') {
    return alert.customerName === null
      ? t('browser.reminderTitleFallback', { minutes: alert.waitingMinutes })
      : t('browser.reminderTitle', {
          name: alert.customerName,
          minutes: alert.waitingMinutes,
        });
  }
  return alert.customerName === null
    ? t('browser.titleFallback')
    : t('browser.title', { name: alert.customerName });
};

export const inboxNotificationCardText = (
  alert: BrowserNotificationAlert,
  minutes: number,
  t: InboxTranslate,
): InboxNotificationCardText => {
  const channel = channelLabel(alert.channelKind, t);
  return {
    title: titleOf(alert, t),
    subtitle:
      alert.kind === 'reminder'
        ? t('browser.reminderSubtitle', { channel, minutes: alert.waitingMinutes })
        : t('browser.subtitle', {
            channel,
            time: inboxUpdatedLabel(Math.max(1, minutes), t),
          }),
    openLabel: t('browser.open'),
    closeLabel: t('browser.close'),
  };
};
