import type { TelegramUpdateType } from '@/modules/channels/constants/telegram.constants';

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
  readonly senderName: string | null;
  readonly text: string | null;
}

export interface TelegramUpdate {
  readonly updateId: string;
  readonly message: TelegramMessage | null;
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
