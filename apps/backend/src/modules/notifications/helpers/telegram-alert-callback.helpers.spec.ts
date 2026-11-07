import { describe, expect, it } from 'vitest';
import {
  parseTelegramTakeOverCallback,
  telegramTakeOverCallbackData,
} from '@/modules/notifications/helpers/telegram-alert-callback.helpers';

const WORKSPACE = 'ws_0123456789abcdefghjkmnpqrs';
const CONVERSATION = 'cnv_0123456789abcdefghjkmnpqrs';

describe('telegram alert callback', () => {
  it('round-trips the workspace and conversation', () => {
    const data = telegramTakeOverCallbackData(WORKSPACE, CONVERSATION);

    expect(parseTelegramTakeOverCallback(data)).toEqual({
      workspacePublicId: WORKSPACE,
      conversationPublicId: CONVERSATION,
    });
  });

  it('fits the Telegram callback data limit', () => {
    expect(telegramTakeOverCallbackData(WORKSPACE, CONVERSATION).length).toBeLessThanOrEqual(64);
  });

  it('rejects a missing or malformed payload', () => {
    expect(parseTelegramTakeOverCallback(null)).toBeNull();
    expect(parseTelegramTakeOverCallback('')).toBeNull();
    expect(parseTelegramTakeOverCallback(WORKSPACE)).toBeNull();
    expect(parseTelegramTakeOverCallback(`to:${WORKSPACE}`)).toBeNull();
    expect(parseTelegramTakeOverCallback(`no:${WORKSPACE}:${CONVERSATION}`)).toBeNull();
    expect(parseTelegramTakeOverCallback(`to:${WORKSPACE}:${CONVERSATION}:extra`)).toBeNull();
  });
});
