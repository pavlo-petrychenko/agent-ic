import {
  NOTIFICATION_CHANNELS,
  NOTIFICATION_CHANNEL_ENABLED_BY_DEFAULT,
  NotificationChannel,
} from '@/modules/notifications/constants/notification.constants';
import type {
  NewNotificationChannelRecord,
  NotificationChannelSettingRecord,
  NotificationChannelValue,
  NotificationSettingsRecord,
  NotificationSettingsView,
} from '@/modules/notifications/typedefs/notification-settings.typedefs';

export const defaultNotificationChannelRows = (
  workspaceId: string,
  settingsId: string,
  newId: () => string,
): readonly NewNotificationChannelRecord[] =>
  NOTIFICATION_CHANNELS.map((channel) => ({
    id: newId(),
    workspaceId,
    settingsId,
    channel,
    enabled: NOTIFICATION_CHANNEL_ENABLED_BY_DEFAULT[channel],
  }));

const channelOf = (
  record: NotificationSettingsRecord | null,
  channel: NotificationChannelValue,
): NotificationChannelSettingRecord | null =>
  record?.channels.find((candidate) => candidate.channel === channel) ?? null;

export const toNotificationSettingsView = (
  record: NotificationSettingsRecord | null,
): NotificationSettingsView => {
  const platform = channelOf(record, NotificationChannel.Platform);
  const email = channelOf(record, NotificationChannel.Email);
  const telegram = channelOf(record, NotificationChannel.Telegram);
  return {
    platform: {
      enabled:
        platform?.enabled ?? NOTIFICATION_CHANNEL_ENABLED_BY_DEFAULT[NotificationChannel.Platform],
    },
    email: {
      enabled: email?.enabled ?? NOTIFICATION_CHANNEL_ENABLED_BY_DEFAULT[NotificationChannel.Email],
      email: email?.email ?? null,
      verifiedAt: email?.verifiedAt ?? null,
    },
    telegram: {
      enabled:
        telegram?.enabled ?? NOTIFICATION_CHANNEL_ENABLED_BY_DEFAULT[NotificationChannel.Telegram],
      linked: telegram !== null && telegram.chatId !== null,
      linkedAt: telegram?.linkedAt ?? null,
    },
  };
};

export const enabledNotificationChannels = (
  view: NotificationSettingsView,
): readonly NotificationChannelValue[] => {
  const channels: NotificationChannelValue[] = [];
  if (view.platform.enabled) {
    channels.push(NotificationChannel.Platform);
  }
  if (view.email.enabled) {
    channels.push(NotificationChannel.Email);
  }
  if (view.telegram.enabled && view.telegram.linked) {
    channels.push(NotificationChannel.Telegram);
  }
  return channels;
};
