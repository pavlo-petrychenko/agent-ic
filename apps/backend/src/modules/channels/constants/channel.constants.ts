export const CHANNELS_SCHEMA = 'channels';

export enum ChannelType {
  Telegram = 'telegram',
  Api = 'api',
}

export enum ChannelStatus {
  Pending = 'pending',
  Connected = 'connected',
  Broken = 'broken',
  Disconnected = 'disconnected',
}
