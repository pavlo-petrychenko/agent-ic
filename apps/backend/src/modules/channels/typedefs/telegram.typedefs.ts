import type { TelegramChannelIdentity } from '@/modules/channels/typedefs/channel-identity.typedefs';

export interface TelegramQuickReplyCallback {
  readonly messageId: string;
  readonly index: number;
}

export interface TelegramTokenHealthResult {
  readonly checked: number;
  readonly broken: number;
}

export type CheckTelegramTokenHealthInput = Readonly<Record<string, never>>;

export interface TelegramPollerChannel {
  readonly id: string;
  readonly workspaceId: string;
  readonly credentialsSealed: string;
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
