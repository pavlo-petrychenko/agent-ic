import { inboxUpdatedLabel } from '@/features/inbox/logic/helpers/inboxList.helpers';
import type { InboxNotificationCardText } from '@/features/inbox/typedefs/browserNotification.typedefs';
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

export const inboxNotificationCardText = (
  customerName: string | null,
  channelKind: string | null,
  minutes: number,
  t: InboxTranslate,
): InboxNotificationCardText => ({
  title:
    customerName === null ? t('browser.titleFallback') : t('browser.title', { name: customerName }),
  subtitle: t('browser.subtitle', {
    channel: channelLabel(channelKind, t),
    time: inboxUpdatedLabel(Math.max(1, minutes), t),
  }),
  openLabel: t('browser.open'),
});
