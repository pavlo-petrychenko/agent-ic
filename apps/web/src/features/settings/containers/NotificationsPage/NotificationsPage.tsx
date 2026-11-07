import { WorkspaceRole } from '@agent-ic/contracts';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useBrowserNotificationPermission } from '@/features/inbox';
import { useCreateTelegramNotificationLink } from '@/features/settings/communication/hooks/useCreateTelegramNotificationLink';
import { useNotificationSettings } from '@/features/settings/communication/hooks/useNotificationSettings';
import { useUnlinkTelegramNotification } from '@/features/settings/communication/hooks/useUnlinkTelegramNotification';
import { useUpdateNotificationChannel } from '@/features/settings/communication/hooks/useUpdateNotificationChannel';
import { TELEGRAM_LINK_POLL_INTERVAL_MS } from '@/features/settings/constants/notifications.constants';
import { SETTINGS_NAMESPACE } from '@/features/settings/constants/settingsI18n.constants';
import type { NotificationsPageProps } from '@/features/settings/containers/NotificationsPage/NotificationsPage.typedefs';
import { settingsHref } from '@/features/settings/logic/helpers/route.helpers';
import {
  formatTelegramLinkCode,
  formatTelegramLinkedAt,
  telegramLinkMinutesLeft,
} from '@/features/settings/logic/helpers/telegramLink.helpers';
import type { TelegramNotificationLink } from '@/features/settings/typedefs/telegramLink.typedefs';
import { BrowserNotificationAction } from '@/features/settings/view/BrowserNotificationAction';
import { NotificationsCard } from '@/features/settings/view/NotificationsCard';
import type { NotificationPreferenceRowModel } from '@/features/settings/view/NotificationsCard';
import { TelegramLinkCard } from '@/features/settings/view/TelegramLinkCard';
import { TelegramLinkedFooter } from '@/features/settings/view/TelegramLinkedFooter';
import { TelegramPreferenceAction } from '@/features/settings/view/TelegramPreferenceAction';
import { useActiveWorkspace, useWorkspaceShell } from '@/features/workspace';
import { NotificationChannel } from '@/shared/api/generated/schema.generated';
import { toAppError } from '@/shared/api/helpers/appError.helpers';
import { useErrorMessage } from '@/shared/i18n/hooks/useErrorMessage';
import { Switch } from '@/shared/ui/inputs/Switch';
import { PageHeader } from '@/shared/ui/layout/PageHeader';
import { Breadcrumb } from '@/shared/ui/navigation/Breadcrumb';
import { ToastTone, useToast } from '@/shared/ui/overlays/Toast';

export function NotificationsPage({ workspaceId }: NotificationsPageProps) {
  const { t, i18n } = useTranslation(SETTINGS_NAMESPACE);
  const { showToast } = useToast();
  const [telegramLink, setTelegramLink] = useState<TelegramNotificationLink | null>(null);
  const [awaitingTelegramLink, setAwaitingTelegramLink] = useState(false);
  const { settings, loading } = useNotificationSettings(
    awaitingTelegramLink ? TELEGRAM_LINK_POLL_INTERVAL_MS : 0,
  );
  const updateChannel = useUpdateNotificationChannel();
  const { createLink, creating } = useCreateTelegramNotificationLink();
  const unlinkTelegram = useUnlinkTelegramNotification();
  const errorMessage = useErrorMessage();
  const browser = useBrowserNotificationPermission();
  const user = useWorkspaceShell(workspaceId).data?.user ?? null;
  const active = useActiveWorkspace(workspaceId);

  const isOperator = active?.role === WorkspaceRole.Operator;
  const name = user?.name ?? '';

  const browserHint =
    browser.permission === 'granted'
      ? t('notifications.browser.enabled')
      : browser.permission === 'denied'
        ? t('notifications.browser.denied')
        : browser.permission === 'unsupported'
          ? t('notifications.browser.unsupported')
          : t('notifications.browser.hint');

  const telegramDescription = !settings.telegramLinked
    ? t('notifications.card.telegramNotLinked')
    : settings.telegramUsername === null
      ? t('notifications.card.telegramLinkedShort')
      : settings.telegramBotUsername === null
        ? t('notifications.card.telegramLinkedAs', {
            username: settings.telegramUsername,
          })
        : t('notifications.card.telegramLinked', {
            account: `@${settings.telegramUsername}`,
            bot: `@${settings.telegramBotUsername}`,
          });

  const changeChannel = (channel: NotificationChannel, enabled: boolean) => {
    void updateChannel(channel, enabled).catch((error: unknown) => {
      showToast({ message: errorMessage(toAppError(error)), tone: ToastTone.Err });
    });
  };

  const startTelegramLink = async () => {
    try {
      const link = await createLink();
      if (link !== null) {
        setTelegramLink(link);
        setAwaitingTelegramLink(true);
      }
    } catch (error) {
      showToast({ message: errorMessage(toAppError(error)), tone: ToastTone.Err });
    }
  };

  const closeTelegramLink = () => {
    setTelegramLink(null);
    setAwaitingTelegramLink(false);
  };

  const unlinkTelegramAccount = async () => {
    try {
      await unlinkTelegram();
      closeTelegramLink();
    } catch (error) {
      showToast({ message: errorMessage(toAppError(error)), tone: ToastTone.Err });
    }
  };

  const copyTelegramCode = async () => {
    if (telegramLink === null) {
      return;
    }
    try {
      await navigator.clipboard.writeText(telegramLink.code);
      showToast({ message: t('notifications.link.copied'), tone: ToastTone.Ok });
    } catch (error) {
      showToast({ message: errorMessage(toAppError(error)), tone: ToastTone.Err });
    }
  };

  const rows: readonly NotificationPreferenceRowModel[] = [
    {
      id: 'platform',
      title: t('notifications.card.inPlatform'),
      description: t('notifications.card.inPlatformHint'),
      action: (
        <Switch
          checked={settings.platformEnabled}
          onCheckedChange={(enabled) => changeChannel(NotificationChannel.Platform, enabled)}
          disabled={loading}
          aria-label={t('notifications.card.inPlatform')}
        />
      ),
    },
    {
      id: 'browser',
      title: t('notifications.browser.title'),
      description: browserHint,
      action: (
        <BrowserNotificationAction
          state={browser.permission}
          onRequest={() => void browser.request()}
        />
      ),
    },
    {
      id: 'email',
      title: t('notifications.card.email'),
      description: settings.email ?? user?.email ?? '',
      action: (
        <Switch
          checked={settings.emailEnabled}
          onCheckedChange={(enabled) => changeChannel(NotificationChannel.Email, enabled)}
          disabled={loading}
          aria-label={t('notifications.card.email')}
        />
      ),
    },
    {
      id: 'telegram',
      title: t('notifications.card.telegram'),
      description: telegramDescription,
      action: (
        <TelegramPreferenceAction
          linked={settings.telegramLinked}
          enabled={settings.telegramEnabled}
          waiting={telegramLink !== null && !settings.telegramLinked}
          creating={creating}
          disabled={loading}
          onStart={() => void startTelegramLink()}
          onToggle={(enabled) => changeChannel(NotificationChannel.Telegram, enabled)}
        />
      ),
    },
  ];

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
        <NotificationsCard
          title={t('notifications.card.title')}
          description={
            isOperator
              ? t('notifications.card.personal', { name })
              : t('notifications.card.personalOperators', { name })
          }
          rows={rows}
          footer={t('notifications.card.footer')}
        >
          {settings.telegramLinked ? (
            <TelegramLinkedFooter
              linkedOn={
                settings.telegramLinkedAt === null
                  ? null
                  : formatTelegramLinkedAt(settings.telegramLinkedAt, i18n.language)
              }
              onUnlink={() => void unlinkTelegramAccount()}
            />
          ) : null}
          {telegramLink === null || settings.telegramLinked ? null : (
            <TelegramLinkCard
              code={telegramLink.code}
              formattedCode={formatTelegramLinkCode(telegramLink.code)}
              botUsername={telegramLink.botUsername}
              minutesLeft={telegramLinkMinutesLeft(telegramLink.expiresAt)}
              onCopy={() => void copyTelegramCode()}
            />
          )}
        </NotificationsCard>
      </div>
    </div>
  );
}
