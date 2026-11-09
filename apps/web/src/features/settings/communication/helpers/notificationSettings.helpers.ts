import type { NotificationSettingsQuery } from '@/features/settings/communication/gql/query/notificationSettings.generated';
import type { NotificationSettingsView } from '@/features/settings/typedefs/notificationSettings.typedefs';

export const EMPTY_NOTIFICATION_SETTINGS: NotificationSettingsView = {
  platformEnabled: true,
  emailEnabled: true,
  email: null,
  telegramEnabled: false,
  telegramLinked: false,
  telegramLinkedAt: null,
};

export const toNotificationSettingsView = (
  data: NotificationSettingsQuery | undefined,
): NotificationSettingsView => {
  if (data === undefined) {
    return EMPTY_NOTIFICATION_SETTINGS;
  }
  const settings = data.notificationSettings;
  return {
    platformEnabled: settings.platform.enabled,
    emailEnabled: settings.email.enabled,
    email: settings.email.email,
    telegramEnabled: settings.telegram.enabled,
    telegramLinked: settings.telegram.linked,
    telegramLinkedAt: settings.telegram.linkedAt,
  };
};
