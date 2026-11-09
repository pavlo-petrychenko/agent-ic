import { WorkspaceRole } from '@agent-ic/contracts';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNotificationSettings } from '@/features/settings/communication/hooks/useNotificationSettings';
import { TELEGRAM_LINK_POLL_INTERVAL_MS } from '@/features/settings/constants/notifications.constants';
import { SETTINGS_NAMESPACE } from '@/features/settings/constants/settingsI18n.constants';
import type {
  TelegramLinkCardModel,
  UseNotificationsPageResult,
} from '@/features/settings/containers/NotificationsPage/NotificationsPage.typedefs';
import { useNotificationChannels } from '@/features/settings/containers/NotificationsPage/useNotificationChannels';
import { useNotificationEmailField } from '@/features/settings/containers/NotificationsPage/useNotificationEmailField';
import { useTelegramNotificationLink } from '@/features/settings/containers/NotificationsPage/useTelegramNotificationLink';
import {
  formatTelegramLinkCode,
  formatTelegramLinkedAt,
  telegramLinkMinutesLeft,
} from '@/features/settings/logic/helpers/telegramLink.helpers';
import { useActiveWorkspace, useWorkspaceShell } from '@/features/workspace';

export function useNotificationsPage(
  workspaceId: string,
  verificationToken: string | null,
  onVerificationHandled: () => void,
): UseNotificationsPageResult {
  const { t, i18n } = useTranslation(SETTINGS_NAMESPACE);
  const user = useWorkspaceShell(workspaceId).data?.user ?? null;
  const active = useActiveWorkspace(workspaceId);
  const userId = user?.userId ?? null;

  const telegram = useTelegramNotificationLink(workspaceId, userId);
  const { settings, loading } = useNotificationSettings(
    telegram.pending === null ? 0 : TELEGRAM_LINK_POLL_INTERVAL_MS,
  );
  const channels = useNotificationChannels(settings);
  const emailField = useNotificationEmailField(
    settings,
    user?.email ?? '',
    verificationToken,
    onVerificationHandled,
  );

  const clearTelegramLink = telegram.clear;
  useEffect(() => {
    if (settings.telegramLinked) {
      clearTelegramLink();
    }
  }, [clearTelegramLink, settings.telegramLinked]);

  const isOperator = active?.role === WorkspaceRole.Operator;
  const name = user?.name ?? '';
  const visibleTelegramLink = settings.telegramLinked ? null : telegram.pending;

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

  const telegramLink: TelegramLinkCardModel | null =
    visibleTelegramLink === null
      ? null
      : {
          code: visibleTelegramLink.code,
          formattedCode: formatTelegramLinkCode(visibleTelegramLink.code),
          botUsername: visibleTelegramLink.botUsername,
          minutesLeft: telegramLinkMinutesLeft(visibleTelegramLink.expiresAt),
        };

  return {
    cardTitle: t('notifications.card.title'),
    cardDescription: isOperator
      ? t('notifications.card.personal', { name })
      : t('notifications.card.personalOperators', { name }),
    cardFooter: t('notifications.card.footer'),
    preferences: {
      platformEnabled: channels.platformEnabled,
      browserState: channels.browserState,
      browserHint: channels.browserHint,
      emailEnabled: channels.emailEnabled,
      email: settings.email ?? user?.email ?? '',
      telegram: {
        linked: settings.telegramLinked,
        enabled: settings.telegramEnabled,
        waiting: visibleTelegramLink !== null,
        description: telegramDescription,
      },
      loading,
      creating: telegram.creating,
      onTogglePlatform: channels.onTogglePlatform,
      onRequestBrowser: channels.onRequestBrowser,
      onToggleEmail: channels.onToggleEmail,
      onStartTelegram: () => void telegram.start(),
      onToggleTelegram: channels.onToggleTelegram,
    },
    emailField,
    telegramLinked: settings.telegramLinked,
    telegramLinkedOn:
      settings.telegramLinkedAt === null
        ? null
        : formatTelegramLinkedAt(settings.telegramLinkedAt, i18n.language),
    telegramLink,
    onUnlinkTelegram: () => void telegram.unlink(),
    onCopyTelegramCode: () => void telegram.copy(),
  };
}
