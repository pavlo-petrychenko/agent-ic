import { useTranslation } from 'react-i18next';
import { SETTINGS_NAMESPACE } from '@/features/settings/constants/settingsI18n.constants';
import { BrowserNotificationAction } from '@/features/settings/view/BrowserNotificationAction';
import type { NotificationPreferencesProps } from '@/features/settings/view/NotificationPreferences/NotificationPreferences.typedefs';
import { NotificationPreferenceRow } from '@/features/settings/view/NotificationsCard/NotificationPreferenceRow';
import type { NotificationPreferenceRowModel } from '@/features/settings/view/NotificationsCard/NotificationPreferenceRow';
import { TelegramPreferenceAction } from '@/features/settings/view/TelegramPreferenceAction';
import { Switch } from '@/shared/ui/inputs/Switch';
import styles from '@/features/settings/view/NotificationPreferences/NotificationPreferences.module.scss';

export function NotificationPreferences({
  platformEnabled,
  browserState,
  browserHint,
  emailEnabled,
  email,
  telegram,
  loading,
  creating,
  onTogglePlatform,
  onRequestBrowser,
  onToggleEmail,
  onStartTelegram,
  onToggleTelegram,
}: NotificationPreferencesProps) {
  const { t } = useTranslation(SETTINGS_NAMESPACE);

  const rows: readonly NotificationPreferenceRowModel[] = [
    {
      id: 'platform',
      title: t('notifications.card.inPlatform'),
      description: t('notifications.card.inPlatformHint'),
      action: (
        <Switch
          checked={platformEnabled}
          onCheckedChange={onTogglePlatform}
          disabled={loading}
          aria-label={t('notifications.card.inPlatform')}
        />
      ),
    },
    {
      id: 'browser',
      title: t('notifications.browser.title'),
      description: browserHint,
      action: <BrowserNotificationAction state={browserState} onRequest={onRequestBrowser} />,
    },
    {
      id: 'email',
      title: t('notifications.card.email'),
      description: email,
      action: (
        <Switch
          checked={emailEnabled}
          onCheckedChange={onToggleEmail}
          disabled={loading}
          aria-label={t('notifications.card.email')}
        />
      ),
    },
    {
      id: 'telegram',
      title: t('notifications.card.telegram'),
      description: telegram.description,
      action: (
        <TelegramPreferenceAction
          linked={telegram.linked}
          enabled={telegram.enabled}
          waiting={telegram.waiting}
          creating={creating}
          disabled={loading}
          onStart={onStartTelegram}
          onToggle={onToggleTelegram}
        />
      ),
    },
  ];

  return (
    <ul className={styles.preferences}>
      {rows.map((row) => (
        <NotificationPreferenceRow key={row.id} row={row} />
      ))}
    </ul>
  );
}
