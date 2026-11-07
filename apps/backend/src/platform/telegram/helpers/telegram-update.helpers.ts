import { MILLISECONDS_PER_SECOND } from '@/platform/clock/constants/time.constants';
import type {
  TelegramCallbackQueryResponse,
  TelegramMessageResponse,
  TelegramUpdateResponse,
} from '@/platform/telegram/typedefs/http-telegram-gateway.typedefs';
import type {
  TelegramCallbackQuery,
  TelegramMessage,
  TelegramUpdate,
} from '@/platform/telegram/typedefs/telegram.typedefs';

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
    senderUsername: sender?.username ?? null,
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
    senderUsername: sender.username ?? null,
    data: query.data ?? null,
  };
};
