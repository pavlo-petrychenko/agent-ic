import { WorkspaceRole } from '@agent-ic/contracts';
import { useTranslation } from 'react-i18next';
import { useNotificationSettings } from '@/features/settings/communication/hooks/useNotificationSettings';
import { useUpdateNotificationChannel } from '@/features/settings/communication/hooks/useUpdateNotificationChannel';
import { SETTINGS_NAMESPACE } from '@/features/settings/constants/settingsI18n.constants';
import type { NotificationsPageProps } from '@/features/settings/containers/NotificationsPage/NotificationsPage.typedefs';
import { settingsHref } from '@/features/settings/logic/helpers/route.helpers';
import { useActiveWorkspace, useWorkspaceShell } from '@/features/workspace';
import { NotificationChannel } from '@/shared/api/generated/schema.generated';
import { toAppError } from '@/shared/api/helpers/appError.helpers';
import { useErrorMessage } from '@/shared/i18n/hooks/useErrorMessage';
import { Card } from '@/shared/ui/display/Card';
import { Switch } from '@/shared/ui/inputs/Switch';
import { PageHeader } from '@/shared/ui/layout/PageHeader';
import { Breadcrumb } from '@/shared/ui/navigation/Breadcrumb';
import { ToastTone, useToast } from '@/shared/ui/overlays/Toast';
import { Heading, HeadingElement, HeadingSize } from '@/shared/ui/typography/Heading';
import { Text, TextColor, TextKind } from '@/shared/ui/typography/Text';
import styles from '@/features/settings/containers/NotificationsPage/NotificationsPage.module.scss';

export function NotificationsPage({ workspaceId }: NotificationsPageProps) {
  const { t } = useTranslation(SETTINGS_NAMESPACE);
  const { showToast } = useToast();
  const { settings, loading } = useNotificationSettings();
  const updateChannel = useUpdateNotificationChannel();
  const errorMessage = useErrorMessage();
  const user = useWorkspaceShell(workspaceId).data?.user ?? null;
  const active = useActiveWorkspace(workspaceId);

  const isOperator = active?.role === WorkspaceRole.Operator;
  const name = user?.name ?? '';

  const changeChannel = (channel: NotificationChannel, enabled: boolean) => {
    void updateChannel(channel, enabled).catch((error: unknown) => {
      showToast({ message: errorMessage(toAppError(error)), tone: ToastTone.Err });
    });
  };

  return (
    <div className="flex flex-col gap-5 pb-8">
      <PageHeader
        title={t('nav.notifications')}
        subtitle={t('notifications.subtitle')}
        crumbs={
          <Breadcrumb
            ariaLabel={t('breadcrumb')}
            moreLabel={t('breadcrumbMore')}
            items={[{ label: t('title'), to: settingsHref(workspaceId) }]}
          />
        }
      />
      <div className="flex flex-col gap-4 px-7">
        <Card>
          <div className="flex flex-col gap-0.5">
            <Heading size={HeadingSize.H3} as={HeadingElement.H3}>
              {t('notifications.card.title')}
            </Heading>
            <Text kind={TextKind.Caption} color={TextColor.Mute}>
              {isOperator
                ? t('notifications.card.personal', { name })
                : t('notifications.card.personalOperators', { name })}
            </Text>
          </div>
          <ul className={styles.preferences}>
            <li className={styles.row}>
              <div className={styles.text}>
                <Text>{t('notifications.card.inPlatform')}</Text>
                <Text kind={TextKind.Caption} color={TextColor.Mute}>
                  {t('notifications.card.inPlatformHint')}
                </Text>
              </div>
              <Switch
                checked={settings.platformEnabled}
                onCheckedChange={(enabled) => changeChannel(NotificationChannel.Platform, enabled)}
                disabled={loading}
                aria-label={t('notifications.card.inPlatform')}
              />
            </li>
            <li className={styles.row}>
              <div className={styles.text}>
                <Text>{t('notifications.card.email')}</Text>
                <Text kind={TextKind.Caption} color={TextColor.Mute}>
                  {settings.email ?? user?.email ?? ''}
                </Text>
              </div>
              <Switch
                checked={settings.emailEnabled}
                onCheckedChange={(enabled) => changeChannel(NotificationChannel.Email, enabled)}
                disabled={loading}
                aria-label={t('notifications.card.email')}
              />
            </li>
            <li className={styles.row}>
              <div className={styles.text}>
                <Text>{t('notifications.card.telegram')}</Text>
                <Text kind={TextKind.Caption} color={TextColor.Mute}>
                  {settings.telegramLinked
                    ? t('notifications.card.telegramLinkedShort')
                    : t('notifications.card.telegramNotLinked')}
                </Text>
              </div>
              <Switch
                checked={settings.telegramEnabled}
                onCheckedChange={(enabled) => changeChannel(NotificationChannel.Telegram, enabled)}
                disabled={loading || !settings.telegramLinked}
                aria-label={t('notifications.card.telegram')}
              />
            </li>
          </ul>
          <div className={styles.footer}>
            <Text kind={TextKind.Caption} color={TextColor.Mute}>
              {t('notifications.card.footer')}
            </Text>
          </div>
        </Card>
      </div>
    </div>
  );
}
