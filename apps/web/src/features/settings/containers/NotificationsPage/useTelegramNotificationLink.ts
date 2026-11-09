import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCreateTelegramNotificationLink } from '@/features/settings/communication/hooks/useCreateTelegramNotificationLink';
import { useUnlinkTelegramNotification } from '@/features/settings/communication/hooks/useUnlinkTelegramNotification';
import { SETTINGS_NAMESPACE } from '@/features/settings/constants/settingsI18n.constants';
import type { UseTelegramNotificationLinkResult } from '@/features/settings/containers/NotificationsPage/NotificationsPage.typedefs';
import {
  clearTelegramLink,
  readTelegramLink,
  storeTelegramLink,
} from '@/features/settings/storage/helpers/telegramLinkStorage.helpers';
import type { TelegramNotificationLink } from '@/features/settings/typedefs/telegramLink.typedefs';
import { toAppError } from '@/shared/api/helpers/appError.helpers';
import { useErrorMessage } from '@/shared/i18n/hooks/useErrorMessage';
import { ToastTone, useToast } from '@/shared/ui/overlays/Toast';

interface PendingTelegramLink {
  readonly workspaceId: string;
  readonly userId: string | null;
  readonly link: TelegramNotificationLink | null;
}

export function useTelegramNotificationLink(
  workspaceId: string,
  userId: string | null,
): UseTelegramNotificationLinkResult {
  const { t } = useTranslation(SETTINGS_NAMESPACE);
  const { showToast } = useToast();
  const errorMessage = useErrorMessage();
  const { createLink, creating } = useCreateTelegramNotificationLink();
  const unlinkTelegram = useUnlinkTelegramNotification();
  const [stored, setStored] = useState<PendingTelegramLink>(() => ({
    workspaceId,
    userId,
    link: userId === null ? null : readTelegramLink(workspaceId, userId),
  }));

  if (stored.workspaceId !== workspaceId || stored.userId !== userId) {
    setStored({
      workspaceId,
      userId,
      link: userId === null ? null : readTelegramLink(workspaceId, userId),
    });
  }

  const pending =
    stored.workspaceId === workspaceId && stored.userId === userId ? stored.link : null;

  const setPending = useCallback(
    (link: TelegramNotificationLink | null) => {
      setStored({ workspaceId, userId, link });
    },
    [userId, workspaceId],
  );

  const clear = useCallback(() => {
    if (userId !== null) {
      clearTelegramLink(workspaceId, userId);
    }
    setPending(null);
  }, [setPending, userId, workspaceId]);

  useEffect(() => {
    if (userId === null || pending === null) {
      return;
    }
    const remaining = new Date(pending.expiresAt).getTime() - Date.now();
    const timeout = window.setTimeout(clear, Math.max(remaining, 0));
    return () => window.clearTimeout(timeout);
  }, [clear, pending, userId]);

  const start = useCallback(async () => {
    try {
      const link = await createLink();
      if (link === null) {
        return;
      }
      setPending(link);
      if (userId !== null) {
        storeTelegramLink(workspaceId, userId, link);
      }
    } catch (error) {
      showToast({ message: errorMessage(toAppError(error)), tone: ToastTone.Err });
    }
  }, [createLink, errorMessage, setPending, showToast, userId, workspaceId]);

  const unlink = useCallback(async () => {
    try {
      await unlinkTelegram();
      clear();
    } catch (error) {
      showToast({ message: errorMessage(toAppError(error)), tone: ToastTone.Err });
    }
  }, [clear, errorMessage, showToast, unlinkTelegram]);

  const copy = useCallback(async () => {
    if (pending === null) {
      return;
    }
    try {
      await navigator.clipboard.writeText(pending.code);
      showToast({ message: t('notifications.link.copied'), tone: ToastTone.Ok });
    } catch (error) {
      showToast({ message: errorMessage(toAppError(error)), tone: ToastTone.Err });
    }
  }, [errorMessage, pending, showToast, t]);

  return { pending, creating, start, clear, unlink, copy };
}
