import { describe, expect, it } from 'vitest';
import {
  isTelegramLinkCodeConflict,
  telegramLinkCodeFromMessage,
  telegramLinkReply,
} from '@/modules/notifications/helpers/telegram-link.helpers';
import { TelegramLinkStatus } from '@/modules/notifications/typedefs/telegram-link.typedefs';

describe('telegramLinkCodeFromMessage', () => {
  it('reads the start payload', () => {
    expect(telegramLinkCodeFromMessage('/start 482913')).toBe('482913');
  });

  it('reads a pasted code with a space', () => {
    expect(telegramLinkCodeFromMessage(' 482 913 ')).toBe('482913');
  });

  it('rejects a value that is not a six-digit code', () => {
    expect(telegramLinkCodeFromMessage('/start')).toBeNull();
    expect(telegramLinkCodeFromMessage('hello')).toBeNull();
    expect(telegramLinkCodeFromMessage('48291')).toBeNull();
    expect(telegramLinkCodeFromMessage('4829130')).toBeNull();
  });
});

describe('isTelegramLinkCodeConflict', () => {
  it('accepts the link code hash unique violation', () => {
    expect(
      isTelegramLinkCodeConflict({
        code: '23505',
        constraint: 'telegram_notification_channels_link_code_hash_key',
      }),
    ).toBe(true);
  });

  it('rejects another unique violation', () => {
    expect(isTelegramLinkCodeConflict({ code: '23505', constraint: 'other_key' })).toBe(false);
    expect(isTelegramLinkCodeConflict({ code: '23505' })).toBe(false);
  });

  it('rejects other errors', () => {
    expect(isTelegramLinkCodeConflict({ code: '23503' })).toBe(false);
    expect(isTelegramLinkCodeConflict(new Error('boom'))).toBe(false);
    expect(isTelegramLinkCodeConflict(null)).toBe(false);
  });
});

describe('telegramLinkReply', () => {
  it('returns a reply for every status', () => {
    expect(telegramLinkReply(TelegramLinkStatus.Linked)).toContain('linked');
    expect(telegramLinkReply(TelegramLinkStatus.Invalid)).toContain('invalid');
    expect(telegramLinkReply(TelegramLinkStatus.Expired)).toContain('expired');
    expect(telegramLinkReply(TelegramLinkStatus.AlreadyLinked)).toContain('already');
    expect(telegramLinkReply(TelegramLinkStatus.NotConfigured)).toContain('Settings');
  });
});
