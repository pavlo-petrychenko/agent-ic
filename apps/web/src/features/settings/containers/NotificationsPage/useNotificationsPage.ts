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
import type { UseNotificationsPageResult } from '@/features/settings/containers/NotificationsPage/NotificationsPage.typedefs';
import {
  formatTelegramLinkCode,
  formatTelegramLinkedAt,
  telegramLinkMinutesLeft,
} from '@/features/settings/logic/helpers/telegramLink.helpers';
import type { TelegramNotificationLink } from '@/features/settings/typedefs/telegramLink.typedefs';
import { useActiveWorkspace, useWorkspaceShell } from '@/features/workspace';
import { NotificationChannel } from '@/shared/api/generated/schema.generated';
import { toAppError } from '@/shared/api/helpers/appError.helpers';
import { useErrorMessage } from '@/shared/i18n/hooks/useErrorMessage';
import { ToastTone, useToast } from '@/shared/ui/overlays/Toast';

export function useNotificationsPage(workspaceId: string): UseNotificationsPageResult {
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

  return {
    cardTitle: t('notifications.card.title'),
    cardDescription: isOperator
      ? t('notifications.card.personal', { name })
      : t('notifications.card.personalOperators', { name }),
    cardFooter: t('notifications.card.footer'),
    preferences: {
      platformEnabled: settings.platformEnabled,
      browserState: browser.permission,
      browserHint,
      emailEnabled: settings.emailEnabled,
      email: settings.email ?? user?.email ?? '',
      telegram: {
        linked: settings.telegramLinked,
        enabled: settings.telegramEnabled,
        waiting: telegramLink !== null && !settings.telegramLinked,
        description: telegramDescription,
      },
      loading,
      creating,
      onTogglePlatform: (enabled) => changeChannel(NotificationChannel.Platform, enabled),
      onRequestBrowser: () => void browser.request(),
      onToggleEmail: (enabled) => changeChannel(NotificationChannel.Email, enabled),
      onStartTelegram: () => void startTelegramLink(),
      onToggleTelegram: (enabled) => changeChannel(NotificationChannel.Telegram, enabled),
    },
    telegramLinked: settings.telegramLinked,
    telegramLinkedOn:
      settings.telegramLinkedAt === null
        ? null
        : formatTelegramLinkedAt(settings.telegramLinkedAt, i18n.language),
    telegramLink:
      telegramLink === null || settings.telegramLinked
        ? null
        : {
            code: telegramLink.code,
            formattedCode: formatTelegramLinkCode(telegramLink.code),
            botUsername: telegramLink.botUsername,
            minutesLeft: telegramLinkMinutesLeft(telegramLink.expiresAt),
          },
    onUnlinkTelegram: () => void unlinkTelegramAccount(),
    onCopyTelegramCode: () => void copyTelegramCode(),
  };
}
