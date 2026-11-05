export const CHANNELS_SCHEMA = 'channels';

export enum ChannelStatus {
  Pending = 'pending',
  Connected = 'connected',
  Broken = 'broken',
  Disconnected = 'disconnected',
}

export enum ApiReplyMode {
  Response = 'response',
  Webhook = 'webhook',
}

export enum ApiChannelReplyStatus {
  Answered = 'answered',
  Escalated = 'escalated',
  Pending = 'pending',
}
