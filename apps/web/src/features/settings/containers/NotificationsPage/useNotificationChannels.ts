import { useTranslation } from 'react-i18next';
import { useBrowserNotificationPermission } from '@/features/inbox';
import { useUpdateNotificationChannel } from '@/features/settings/communication/hooks/useUpdateNotificationChannel';
import { SETTINGS_NAMESPACE } from '@/features/settings/constants/settingsI18n.constants';
import type { UseNotificationChannelsResult } from '@/features/settings/containers/NotificationsPage/NotificationsPage.typedefs';
import type { NotificationSettingsView } from '@/features/settings/typedefs/notificationSettings.typedefs';
import { NotificationChannel } from '@/shared/api/generated/schema.generated';
import { toAppError } from '@/shared/api/helpers/appError.helpers';
import { useErrorMessage } from '@/shared/i18n/hooks/useErrorMessage';
import { ToastTone, useToast } from '@/shared/ui/overlays/Toast';

export function useNotificationChannels(
  settings: NotificationSettingsView,
): UseNotificationChannelsResult {
  const { t } = useTranslation(SETTINGS_NAMESPACE);
  const { showToast } = useToast();
  const updateChannel = useUpdateNotificationChannel();
  const browser = useBrowserNotificationPermission();
  const errorMessage = useErrorMessage();

  const changeChannel = (channel: NotificationChannel, enabled: boolean) => {
    void updateChannel(channel, enabled).catch((error: unknown) => {
      showToast({ message: errorMessage(toAppError(error)), tone: ToastTone.Err });
    });
  };

  const browserHint =
    browser.permission === 'granted'
      ? t('notifications.browser.enabled')
      : browser.permission === 'denied'
        ? t('notifications.browser.denied')
        : browser.permission === 'unsupported'
          ? t('notifications.browser.unsupported')
          : t('notifications.browser.hint');

  return {
    platformEnabled: settings.platformEnabled,
    emailEnabled: settings.emailEnabled,
    browserState: browser.permission,
    browserHint,
    onTogglePlatform: (enabled) => changeChannel(NotificationChannel.Platform, enabled),
    onRequestBrowser: () => void browser.request(),
    onToggleEmail: (enabled) => changeChannel(NotificationChannel.Email, enabled),
    onToggleTelegram: (enabled) => changeChannel(NotificationChannel.Telegram, enabled),
  };
}
