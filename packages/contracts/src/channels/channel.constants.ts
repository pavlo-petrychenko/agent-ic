export enum ChannelKind {
  Simulated = 'simulated',
  Telegram = 'telegram',
  Api = 'api',
}

export const CHANNEL_PROVIDERS = [ChannelKind.Telegram, ChannelKind.Api] as const;

export const CHANNEL_KINDS = [
  ChannelKind.Simulated,
  ChannelKind.Telegram,
  ChannelKind.Api,
] as const;
