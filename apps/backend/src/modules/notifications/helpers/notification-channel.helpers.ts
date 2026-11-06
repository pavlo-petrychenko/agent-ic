import { NotifyChannel } from '@agent-ic/flow';
import { NotificationChannel } from '@/modules/notifications/constants/notification.constants';
import type { HandoffNotify } from '@/modules/notifications/typedefs/notification-recipients.typedefs';
import type { NotificationChannelValue } from '@/modules/notifications/typedefs/notification-settings.typedefs';

const CHANNEL_OF_NOTIFY: Readonly<Record<NotifyChannel, NotificationChannelValue>> = {
  [NotifyChannel.InPlatform]: NotificationChannel.Platform,
  [NotifyChannel.Email]: NotificationChannel.Email,
  [NotifyChannel.Telegram]: NotificationChannel.Telegram,
};

export const notificationChannelsOf = (
  notify: HandoffNotify,
): readonly NotificationChannelValue[] => [
  ...new Set(notify.channels.map((channel) => CHANNEL_OF_NOTIFY[channel])),
];

export const intersectNotificationChannels = (
  enabled: readonly NotificationChannelValue[],
  requested: readonly NotificationChannelValue[],
): readonly NotificationChannelValue[] => requested.filter((channel) => enabled.includes(channel));
