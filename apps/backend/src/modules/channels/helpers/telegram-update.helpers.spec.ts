import { ChannelKind } from '@agent-ic/contracts';
import { describe, expect, it } from 'vitest';
import {
  toIncomingMessageInput,
  toTelegramUpdate,
} from '@/modules/channels/helpers/telegram-update.helpers';
import { ConversationMode } from '@/modules/conversations';

const CHANNEL = { id: 'chn_1', workspaceId: 'ws_1', agentId: 'agt_1' };

const MESSAGE = {
  messageId: '5',
  sentAt: new Date('2026-10-27T10:00:00.000Z'),
  chatId: '42',
  senderId: '900',
  senderName: 'Moshe',
  text: 'Hello',
};

describe('toTelegramUpdate', () => {
  it('maps a callback query update', () => {
    expect(
      toTelegramUpdate({
        update_id: 20,
        callback_query: {
          id: 'callback-1',
          from: { id: 900, first_name: 'Moshe' },
          message: { message_id: 5, date: 1_760_000_000, chat: { id: 42 } },
          data: 'qr:msg_1:0',
        },
      }),
    ).toEqual({
      updateId: '20',
      message: null,
      callbackQuery: {
        id: 'callback-1',
        chatId: '42',
        telegramMessageId: '5',
        senderId: '900',
        senderName: 'Moshe',
        data: 'qr:msg_1:0',
      },
    });
  });

  it('maps a callback query without a message or data to nulls', () => {
    expect(
      toTelegramUpdate({
        update_id: 21,
        callback_query: {
          id: 'callback-2',
          from: { id: 900, first_name: 'Moshe' },
        },
      }),
    ).toEqual({
      updateId: '21',
      message: null,
      callbackQuery: {
        id: 'callback-2',
        chatId: null,
        telegramMessageId: null,
        senderId: '900',
        senderName: 'Moshe',
        data: null,
      },
    });
  });

  it('leaves the callback query null for a message update', () => {
    expect(
      toTelegramUpdate({
        update_id: 22,
        message: {
          message_id: 6,
          date: 1_760_000_000,
          text: 'Hello',
          chat: { id: 42 },
        },
      }),
    ).toEqual({
      updateId: '22',
      message: {
        messageId: '6',
        sentAt: new Date(1_760_000_000 * 1_000),
        chatId: '42',
        senderId: null,
        senderName: null,
        text: 'Hello',
      },
      callbackQuery: null,
    });
  });
});

describe('toIncomingMessageInput', () => {
  it('maps a telegram message to an incoming message', () => {
    expect(toIncomingMessageInput(CHANNEL, MESSAGE)).toEqual({
      workspaceId: 'ws_1',
      agentId: 'agt_1',
      mode: ConversationMode.Live,
      channelKind: ChannelKind.Telegram,
      channelId: 'chn_1',
      endUserExternalId: '42',
      endUserName: 'Moshe',
      externalId: '5',
      text: 'Hello',
      versionId: null,
    });
  });

  it('returns null when the channel has no agent', () => {
    expect(toIncomingMessageInput({ ...CHANNEL, agentId: null }, MESSAGE)).toBeNull();
  });

  it('returns null without text to answer', () => {
    expect(toIncomingMessageInput(CHANNEL, { ...MESSAGE, text: null })).toBeNull();
    expect(toIncomingMessageInput(CHANNEL, { ...MESSAGE, text: '   ' })).toBeNull();
  });
});
