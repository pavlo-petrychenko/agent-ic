import { ChannelKind } from '@agent-ic/contracts';
import type { ChannelRecord } from '@/modules/channels/typedefs/channel.typedefs';
import type {
  TelegramCallbackQueryResponse,
  TelegramMessageResponse,
  TelegramUpdateResponse,
} from '@/modules/channels/typedefs/http-telegram-gateway.typedefs';
import type {
  TelegramCallbackQuery,
  TelegramMessage,
  TelegramUpdate,
} from '@/modules/channels/typedefs/telegram.typedefs';
import { ConversationMode } from '@/modules/conversations';
import type { IncomingMessageInput } from '@/modules/conversations';
import { MILLISECONDS_PER_SECOND } from '@/platform/clock/constants/time.constants';

export const toTelegramUpdate = (update: TelegramUpdateResponse): TelegramUpdate => ({
  updateId: String(update.update_id),
  message: update.message === undefined ? null : toTelegramMessage(update.message),
  callbackQuery:
    update.callback_query === undefined ? null : toTelegramCallbackQuery(update.callback_query),
});

export const toTelegramMessage = (message: TelegramMessageResponse): TelegramMessage => {
  const sender = message.from;
  return {
    messageId: String(message.message_id),
    sentAt: new Date(message.date * MILLISECONDS_PER_SECOND),
    chatId: String(message.chat.id),
    senderId: sender === undefined ? null : String(sender.id),
    senderName: sender?.first_name ?? null,
    text: message.text ?? null,
  };
};

export const toTelegramCallbackQuery = (
  query: TelegramCallbackQueryResponse,
): TelegramCallbackQuery => {
  const sender = query.from;
  const message = query.message;
  return {
    id: query.id,
    chatId: message === undefined ? null : String(message.chat.id),
    telegramMessageId: message === undefined ? null : String(message.message_id),
    senderId: String(sender.id),
    senderName: sender.first_name,
    data: query.data ?? null,
  };
};

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
