import type {
  GetTelegramUpdatesInput,
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
}
