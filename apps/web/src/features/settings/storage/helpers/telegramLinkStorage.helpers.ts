import {
  TELEGRAM_LINK_STORAGE_KEY_PREFIX,
  TELEGRAM_LINK_STORAGE_KEY_SEPARATOR,
} from '@/features/settings/constants/notifications.constants';
import type { TelegramNotificationLink } from '@/features/settings/typedefs/telegramLink.typedefs';

const storageKey = (workspaceId: string, userId: string): string =>
  `${TELEGRAM_LINK_STORAGE_KEY_PREFIX}${TELEGRAM_LINK_STORAGE_KEY_SEPARATOR}${workspaceId}${TELEGRAM_LINK_STORAGE_KEY_SEPARATOR}${userId}`;

const toTelegramLink = (value: unknown, now: number): TelegramNotificationLink | null => {
  if (typeof value !== 'object' || value === null) {
    return null;
  }
  const { code, botUsername, expiresAt } = value as Record<string, unknown>;
  if (
    typeof code !== 'string' ||
    typeof botUsername !== 'string' ||
    typeof expiresAt !== 'string'
  ) {
    return null;
  }
  if (new Date(expiresAt).getTime() <= now) {
    return null;
  }
  return { code, botUsername, expiresAt };
};

export const readTelegramLink = (
  workspaceId: string,
  userId: string,
  now: number = Date.now(),
): TelegramNotificationLink | null => {
  const key = storageKey(workspaceId, userId);
  try {
    const stored = window.sessionStorage.getItem(key);
    if (stored === null) {
      return null;
    }
    const link = toTelegramLink(JSON.parse(stored), now);
    if (link === null) {
      window.sessionStorage.removeItem(key);
    }
    return link;
  } catch {
    return null;
  }
};

export const storeTelegramLink = (
  workspaceId: string,
  userId: string,
  link: TelegramNotificationLink,
): void => {
  try {
    window.sessionStorage.setItem(storageKey(workspaceId, userId), JSON.stringify(link));
  } catch {
    return;
  }
};

export const clearTelegramLink = (workspaceId: string, userId: string): void => {
  try {
    window.sessionStorage.removeItem(storageKey(workspaceId, userId));
  } catch {
    return;
  }
};
