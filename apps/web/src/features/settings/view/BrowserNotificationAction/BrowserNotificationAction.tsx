import { useTranslation } from 'react-i18next';
import { SETTINGS_NAMESPACE } from '@/features/settings/constants/settingsI18n.constants';
import type { BrowserNotificationActionProps } from '@/features/settings/view/BrowserNotificationAction/BrowserNotificationAction.typedefs';
import { Button, ButtonVariant } from '@/shared/ui/actions/Button';

export function BrowserNotificationAction({ state, onRequest }: BrowserNotificationActionProps) {
  const { t } = useTranslation(SETTINGS_NAMESPACE);

  if (state !== 'default') {
    return null;
  }

  return (
    <Button variant={ButtonVariant.Secondary} onClick={onRequest}>
      {t('notifications.browser.enable')}
    </Button>
  );
}
