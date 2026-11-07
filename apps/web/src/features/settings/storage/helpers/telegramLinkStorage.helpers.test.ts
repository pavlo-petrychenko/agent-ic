import { beforeEach, describe, expect, it } from 'vitest';
import {
  TELEGRAM_LINK_STORAGE_KEY_PREFIX,
  TELEGRAM_LINK_STORAGE_KEY_SEPARATOR,
} from '@/features/settings/constants/notifications.constants';
import {
  clearTelegramLink,
  readTelegramLink,
  storeTelegramLink,
} from '@/features/settings/storage/helpers/telegramLinkStorage.helpers';

const NOW = new Date('2026-11-07T19:00:00.000Z').getTime();
const LINK = {
  code: '482913',
  botUsername: 'agents_alerts_bot',
  expiresAt: new Date(NOW + 600_000).toISOString(),
};
const KEY = `${TELEGRAM_LINK_STORAGE_KEY_PREFIX}${TELEGRAM_LINK_STORAGE_KEY_SEPARATOR}ws_1${TELEGRAM_LINK_STORAGE_KEY_SEPARATOR}user_1`;

describe('telegram link storage', () => {
  beforeEach(() => window.sessionStorage.clear());

  it('round-trips a link', () => {
    storeTelegramLink('ws_1', 'user_1', LINK);

    expect(readTelegramLink('ws_1', 'user_1', NOW)).toEqual(LINK);
  });

  it('keeps links per workspace and user', () => {
    storeTelegramLink('ws_1', 'user_1', LINK);

    expect(readTelegramLink('ws_1', 'user_2', NOW)).toBeNull();
    expect(readTelegramLink('ws_2', 'user_1', NOW)).toBeNull();
  });

  it('reads null for an unknown link', () => {
    expect(readTelegramLink('ws_1', 'user_1', NOW)).toBeNull();
  });

  it('reads null and removes an expired link', () => {
    storeTelegramLink('ws_1', 'user_1', LINK);

    expect(readTelegramLink('ws_1', 'user_1', NOW + 600_001)).toBeNull();
    expect(window.sessionStorage.length).toBe(0);
  });

  it('reads null for a corrupted entry', () => {
    window.sessionStorage.setItem(KEY, 'not json');

    expect(readTelegramLink('ws_1', 'user_1', NOW)).toBeNull();
  });

  it('removes a link', () => {
    storeTelegramLink('ws_1', 'user_1', LINK);
    clearTelegramLink('ws_1', 'user_1');

    expect(readTelegramLink('ws_1', 'user_1', NOW)).toBeNull();
  });
});
