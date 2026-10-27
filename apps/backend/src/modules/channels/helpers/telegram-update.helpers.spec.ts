import { ChannelKind } from '@agent-ic/contracts';
import { describe, expect, it } from 'vitest';
import { toIncomingMessageInput } from '@/modules/channels/helpers/telegram-update.helpers';
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
