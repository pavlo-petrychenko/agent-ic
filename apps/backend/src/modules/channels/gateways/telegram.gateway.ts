import type {
  AnswerTelegramCallbackQueryInput,
  GetTelegramUpdatesInput,
  SendTelegramChatActionInput,
  SendTelegramMessageInput,
  SetTelegramWebhookInput,
  TelegramBot,
  TelegramUpdate,
  TelegramWebhookInfo,
} from '@/modules/channels/typedefs/telegram.typedefs';

export abstract class TelegramGateway {
  abstract getMe(token: string): Promise<TelegramBot>;

  abstract setWebhook(input: SetTelegramWebhookInput): Promise<void>;

  abstract deleteWebhook(token: string): Promise<void>;

  abstract getWebhookInfo(token: string): Promise<TelegramWebhookInfo>;

  abstract getUpdates(input: GetTelegramUpdatesInput): Promise<TelegramUpdate[]>;

  abstract sendMessage(input: SendTelegramMessageInput): Promise<void>;

  abstract sendChatAction(input: SendTelegramChatActionInput): Promise<void>;

  abstract answerCallbackQuery(input: AnswerTelegramCallbackQueryInput): Promise<void>;
}
