import { ErrorReason } from '@agent-ic/contracts';

export enum ChannelField {
  Id = 'id',
  Token = 'token',
  AgentId = 'agentId',
  ShowTyping = 'showTyping',
  Name = 'name',
  ReplyMode = 'replyMode',
  Webhook = 'webhook',
}

export const CHANNEL_FIELD_REASON: Readonly<Record<string, ErrorReason>> = {
  [ChannelField.Token]: ErrorReason.TelegramTokenInvalid,
  [ChannelField.AgentId]: ErrorReason.InvalidRequest,
  [ChannelField.ShowTyping]: ErrorReason.InvalidRequest,
  [ChannelField.Name]: ErrorReason.InvalidRequest,
  [ChannelField.ReplyMode]: ErrorReason.InvalidRequest,
  [ChannelField.Webhook]: ErrorReason.InvalidRequest,
};

export enum ChannelGraphqlArgument {
  Input = 'input',
  Id = 'id',
}
