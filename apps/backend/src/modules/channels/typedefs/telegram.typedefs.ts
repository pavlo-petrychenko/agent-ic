import type { TelegramUpdateType } from '@/modules/channels/constants/telegram.constants';

export interface TelegramBot {
  readonly id: string;
  readonly username: string | null;
  readonly firstName: string;
}

export interface TelegramWebhookInfo {
  readonly url: string;
  readonly pendingUpdateCount: number;
  readonly lastErrorAt: Date | null;
  readonly lastErrorMessage: string | null;
}

export interface SetTelegramWebhookInput {
  readonly token: string;
  readonly url: string;
  readonly secret: string;
  readonly allowedUpdates: readonly TelegramUpdateType[];
}
