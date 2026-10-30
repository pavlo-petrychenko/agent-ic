import type {
  TelegramChatAction,
  TelegramUpdateType,
} from '@/modules/channels/constants/telegram.constants';
import type { TelegramChannelIdentity } from '@/modules/channels/typedefs/channel-identity.typedefs';

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

export interface TelegramQuickReplyCallback {
  readonly messageId: string;
  readonly index: number;
}

export interface TelegramUpdate {
  readonly updateId: string;
  readonly message: TelegramMessage | null;
  readonly callbackQuery: TelegramCallbackQuery | null;
}

export interface TelegramPollerChannel {
  readonly id: string;
  readonly workspaceId: string;
  readonly credentialsSealed: string;
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
  readonly messageId: string;
  readonly text: string;
  readonly quickReplies: readonly string[];
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

export interface TelegramInlineKeyboardButton {
  readonly text: string;
  readonly callback_data: string;
}

export interface TelegramReplyMarkup {
  readonly inline_keyboard: readonly (readonly TelegramInlineKeyboardButton[])[];
}

export interface TelegramConnectionCredentials {
  readonly sealed: string;
  readonly webhookSecret: string;
}

export interface ConfigureTelegramTransportInput {
  readonly token: string;
  readonly workspaceId: string;
  readonly channelId: string;
  readonly secret: string;
}

export interface TelegramReconnectPreparation {
  readonly token: string;
  readonly identity: TelegramChannelIdentity;
  readonly sealed: string;
  readonly webhookSecret: string;
}
