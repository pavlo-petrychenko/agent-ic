import { WorkspaceRole } from '@agent-ic/contracts';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useBrowserNotificationPermission } from '@/features/inbox';
import { useCreateTelegramNotificationLink } from '@/features/settings/communication/hooks/useCreateTelegramNotificationLink';
import { useNotificationSettings } from '@/features/settings/communication/hooks/useNotificationSettings';
import { useResendNotificationEmailVerification } from '@/features/settings/communication/hooks/useResendNotificationEmailVerification';
import { useUnlinkTelegramNotification } from '@/features/settings/communication/hooks/useUnlinkTelegramNotification';
import { useUpdateNotificationChannel } from '@/features/settings/communication/hooks/useUpdateNotificationChannel';
import { useUpdateNotificationEmail } from '@/features/settings/communication/hooks/useUpdateNotificationEmail';
import { useVerifyNotificationEmail } from '@/features/settings/communication/hooks/useVerifyNotificationEmail';
import { TELEGRAM_LINK_POLL_INTERVAL_MS } from '@/features/settings/constants/notifications.constants';
import { SETTINGS_NAMESPACE } from '@/features/settings/constants/settingsI18n.constants';
import type { UseNotificationsPageResult } from '@/features/settings/containers/NotificationsPage/NotificationsPage.typedefs';
import {
  formatTelegramLinkCode,
  formatTelegramLinkedAt,
  telegramLinkMinutesLeft,
} from '@/features/settings/logic/helpers/telegramLink.helpers';
import {
  clearTelegramLink,
  readTelegramLink,
  storeTelegramLink,
} from '@/features/settings/storage/helpers/telegramLinkStorage.helpers';
import type { TelegramNotificationLink } from '@/features/settings/typedefs/telegramLink.typedefs';
import { useActiveWorkspace, useWorkspaceShell } from '@/features/workspace';
import { NotificationChannel } from '@/shared/api/generated/schema.generated';
import { toAppError } from '@/shared/api/helpers/appError.helpers';
import { useErrorMessage } from '@/shared/i18n/hooks/useErrorMessage';
import { ToastTone, useToast } from '@/shared/ui/overlays/Toast';

export function useNotificationsPage(
  workspaceId: string,
  verificationToken: string | null,
  onVerificationHandled: () => void,
): UseNotificationsPageResult {
  const { t, i18n } = useTranslation(SETTINGS_NAMESPACE);
  const { showToast } = useToast();
  const user = useWorkspaceShell(workspaceId).data?.user ?? null;
  const active = useActiveWorkspace(workspaceId);
  const userId = user?.userId ?? null;

  const [telegramLink, setTelegramLink] = useState<TelegramNotificationLink | null>(() =>
    userId === null ? null : readTelegramLink(workspaceId, userId),
  );
  const [awaitingTelegramLink, setAwaitingTelegramLink] = useState(telegramLink !== null);

  const { settings, loading } = useNotificationSettings(
    awaitingTelegramLink && telegramLink !== null ? TELEGRAM_LINK_POLL_INTERVAL_MS : 0,
  );
  const updateChannel = useUpdateNotificationChannel();
  const updateEmail = useUpdateNotificationEmail();
  const resendEmailVerification = useResendNotificationEmailVerification();
  const verifyEmail = useVerifyNotificationEmail();
  const { createLink, creating } = useCreateTelegramNotificationLink();
  const unlinkTelegram = useUnlinkTelegramNotification();
  const errorMessage = useErrorMessage();
  const browser = useBrowserNotificationPermission();
  const [emailDraft, setEmailDraft] = useState<string | null>(null);
  const [savingEmail, setSavingEmail] = useState(false);
  const [resendingVerification, setResendingVerification] = useState(false);
  const verificationStarted = useRef(false);

  useEffect(() => {
    if (userId === null || telegramLink === null) {
      return;
    }
    const remaining = new Date(telegramLink.expiresAt).getTime() - Date.now();
    if (remaining <= 0) {
      clearTelegramLink(workspaceId, userId);
      return;
    }
    const timeout = window.setTimeout(() => {
      clearTelegramLink(workspaceId, userId);
      setTelegramLink(null);
      setAwaitingTelegramLink(false);
    }, remaining);
    return () => window.clearTimeout(timeout);
  }, [workspaceId, userId, telegramLink]);

  useEffect(() => {
    if (userId !== null && settings.telegramLinked) {
      clearTelegramLink(workspaceId, userId);
    }
  }, [workspaceId, userId, settings.telegramLinked]);

  useEffect(() => {
    if (verificationToken === null || verificationStarted.current) {
      return;
    }
    verificationStarted.current = true;
    void verifyEmail(verificationToken)
      .then(() => {
        showToast({ message: t('notifications.email.verifiedSuccess'), tone: ToastTone.Ok });
      })
      .catch((error: unknown) => {
        showToast({ message: errorMessage(toAppError(error)), tone: ToastTone.Err });
      })
      .finally(onVerificationHandled);
  }, [verificationToken, verifyEmail, onVerificationHandled, showToast, t, errorMessage]);

  const isOperator = active?.role === WorkspaceRole.Operator;
  const name = user?.name ?? '';
  const accountEmail = user?.email ?? '';
  const savedEmail = settings.email ?? accountEmail;
  const usingAccountEmail = settings.email === null;
  const emailVerified = usingAccountEmail || settings.emailVerifiedAt !== null;
  const emailValue = emailDraft ?? savedEmail;

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

  const saveEmail = async () => {
    const nextEmail = emailValue.trim();
    if (nextEmail === '' || (nextEmail === savedEmail && (usingAccountEmail || emailVerified))) {
      return;
    }
    setSavingEmail(true);
    try {
      await updateEmail(nextEmail);
      setEmailDraft(null);
      showToast({
        message: t('notifications.email.verificationSent', { email: nextEmail }),
        tone: ToastTone.Ok,
      });
    } catch (error) {
      showToast({ message: errorMessage(toAppError(error)), tone: ToastTone.Err });
    } finally {
      setSavingEmail(false);
    }
  };

  const resendVerification = async () => {
    setResendingVerification(true);
    try {
      await resendEmailVerification();
      showToast({
        message: t('notifications.email.verificationSent', { email: savedEmail }),
        tone: ToastTone.Ok,
      });
    } catch (error) {
      showToast({ message: errorMessage(toAppError(error)), tone: ToastTone.Err });
    } finally {
      setResendingVerification(false);
    }
  };

  const startTelegramLink = async () => {
    try {
      const link = await createLink();
      if (link !== null) {
        setTelegramLink(link);
        setAwaitingTelegramLink(true);
        if (userId !== null) {
          storeTelegramLink(workspaceId, userId, link);
        }
      }
    } catch (error) {
      showToast({ message: errorMessage(toAppError(error)), tone: ToastTone.Err });
    }
  };

  const closeTelegramLink = () => {
    if (userId !== null) {
      clearTelegramLink(workspaceId, userId);
    }
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

  const visibleTelegramLink = settings.telegramLinked ? null : telegramLink;

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
        waiting: visibleTelegramLink !== null,
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
    emailField: {
      value: emailValue,
      verified: emailVerified,
      usingAccountEmail,
      accountEmail,
      saving: savingEmail,
      resending: resendingVerification,
      onChange: (value) => setEmailDraft(value),
      onSave: () => void saveEmail(),
      onResend: () => void resendVerification(),
    },
    telegramLinked: settings.telegramLinked,
    telegramLinkedOn:
      settings.telegramLinkedAt === null
        ? null
        : formatTelegramLinkedAt(settings.telegramLinkedAt, i18n.language),
    telegramLink:
      visibleTelegramLink === null
        ? null
        : {
            code: visibleTelegramLink.code,
            formattedCode: formatTelegramLinkCode(visibleTelegramLink.code),
            botUsername: visibleTelegramLink.botUsername,
            minutesLeft: telegramLinkMinutesLeft(visibleTelegramLink.expiresAt),
          },
    onUnlinkTelegram: () => void unlinkTelegramAccount(),
    onCopyTelegramCode: () => void copyTelegramCode(),
  };
}
