import { ChannelKind } from '@agent-ic/contracts';
import type { ChannelRecord } from '@/modules/channels/typedefs/channel.typedefs';
import { ConversationMode } from '@/modules/conversations';
import type { IncomingMessageInput } from '@/modules/conversations';
import type {
  TelegramCallbackQuery,
  TelegramMessage,
} from '@/platform/telegram/typedefs/telegram.typedefs';

export const toIncomingMessageInput = (
  channel: Pick<ChannelRecord, 'id' | 'workspaceId' | 'agentId'>,
  message: TelegramMessage,
): IncomingMessageInput | null =>
  toIncomingMessage(channel, {
    endUserExternalId: message.chatId,
    endUserName: message.senderName,
    externalId: message.messageId,
    text: message.text ?? '',
  });

export const toIncomingQuickReplyInput = (
  channel: Pick<ChannelRecord, 'id' | 'workspaceId' | 'agentId'>,
  query: TelegramCallbackQuery,
  text: string,
): IncomingMessageInput | null =>
  query.chatId === null
    ? null
    : toIncomingMessage(channel, {
        endUserExternalId: query.chatId,
        endUserName: query.senderName,
        externalId: query.id,
        text,
      });

const toIncomingMessage = (
  channel: Pick<ChannelRecord, 'id' | 'workspaceId' | 'agentId'>,
  fields: Pick<IncomingMessageInput, 'endUserExternalId' | 'endUserName' | 'externalId' | 'text'>,
): IncomingMessageInput | null => {
  if (channel.agentId === null || fields.text.trim() === '') {
    return null;
  }
  return {
    workspaceId: channel.workspaceId,
    agentId: channel.agentId,
    mode: ConversationMode.Live,
    channelKind: ChannelKind.Telegram,
    channelId: channel.id,
    ...fields,
    versionId: null,
  };
};
