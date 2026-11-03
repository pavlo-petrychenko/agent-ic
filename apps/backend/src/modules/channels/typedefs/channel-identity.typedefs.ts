import type { ApiReplyMode } from '@/modules/channels/constants/channel.constants';

export interface TelegramChannelIdentity {
  readonly username: string;
  readonly firstName: string;
}

export interface ApiChannelIdentity {
  readonly name: string;
  readonly replyMode: ApiReplyMode;
  readonly webhook: string | null;
}

export type ChannelIdentity = TelegramChannelIdentity | ApiChannelIdentity;

export interface TelegramChannelCredentials {
  readonly botToken: string;
  readonly webhookSecretHash: string;
}

export interface ApiChannelCredentials {
  readonly secretKeyHash: string;
  readonly secretKeyHint: string;
  readonly previousSecretKeyHash: string | null;
  readonly previousKeyExpiresAt: string | null;
}

export type ChannelCredentials = TelegramChannelCredentials | ApiChannelCredentials;
