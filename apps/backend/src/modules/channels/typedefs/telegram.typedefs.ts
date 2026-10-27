import type { TelegramUpdateType } from '@/modules/channels/constants/telegram.constants';

export interface TelegramBot {
  readonly id: string;
  readonly username: string;
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
