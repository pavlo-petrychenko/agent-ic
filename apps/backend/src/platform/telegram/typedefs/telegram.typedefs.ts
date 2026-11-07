import type {
  TelegramChatAction,
  TelegramParseMode,
  TelegramUpdateType,
} from '@/platform/telegram/constants/telegram.constants';

export interface TelegramBot {
  readonly id: string;
  readonly username: string;
  readonly firstName: string;
}

export interface TelegramWebhookInfo {
  readonly url: string;
  readonly pendingUpdateCount: number;
  readonly lastErrorAt: Date | null;
  readonly lastErrorMessage: string | null;
}

export interface TelegramMessage {
  readonly messageId: string;
  readonly sentAt: Date;
  readonly chatId: string;
  readonly senderId: string | null;
  readonly senderName: string | null;
  readonly text: string | null;
}

export interface TelegramCallbackQuery {
  readonly id: string;
  readonly chatId: string | null;
  readonly telegramMessageId: string | null;
  readonly senderId: string;
  readonly senderName: string;
  readonly data: string | null;
}

export interface TelegramUpdate {
  readonly updateId: string;
  readonly message: TelegramMessage | null;
  readonly callbackQuery: TelegramCallbackQuery | null;
}

export interface GetTelegramUpdatesInput {
  readonly token: string;
  readonly offset: number;
  readonly timeoutSeconds: number;
  readonly allowedUpdates: readonly TelegramUpdateType[];
}

export interface SetTelegramWebhookInput {
  readonly token: string;
  readonly url: string;
  readonly secret: string;
  readonly allowedUpdates: readonly TelegramUpdateType[];
}

export interface SendTelegramMessageInput {
  readonly token: string;
  readonly chatId: string;
  readonly text: string;
  readonly replyMarkup: TelegramReplyMarkup | null;
  readonly parseMode?: TelegramParseMode | null;
}

export interface SendTelegramChatActionInput {
  readonly token: string;
  readonly chatId: string;
  readonly action: TelegramChatAction;
}

export interface AnswerTelegramCallbackQueryInput {
  readonly token: string;
  readonly callbackQueryId: string;
  readonly text: string | null;
  readonly showAlert: boolean;
}

export interface RemoveTelegramInlineKeyboardInput {
  readonly token: string;
  readonly chatId: string;
  readonly messageId: string;
}

export type TelegramInlineKeyboardButton =
  | {
      readonly text: string;
      readonly callback_data: string;
    }
  | {
      readonly text: string;
      readonly url: string;
    };

export interface TelegramReplyMarkup {
  readonly inline_keyboard: readonly (readonly TelegramInlineKeyboardButton[])[];
}
