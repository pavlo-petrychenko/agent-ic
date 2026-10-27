export interface TelegramChannelIdentity {
  readonly username: string;
}

export interface ApiChannelIdentity {
  readonly name: string;
}

export type ChannelIdentity = TelegramChannelIdentity | ApiChannelIdentity;

export interface TelegramChannelCredentials {
  readonly botToken: string;
  readonly webhookSecretHash: string;
}

export interface ApiChannelCredentials {
  readonly secretKeyHash: string;
}

export type ChannelCredentials = TelegramChannelCredentials | ApiChannelCredentials;
