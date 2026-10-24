import { ErrorReason } from '@agent-ic/contracts';

export enum ChannelField {
  Token = 'token',
  AgentId = 'agentId',
  ShowTyping = 'showTyping',
}

export const CHANNEL_FIELD_REASON: Readonly<Record<string, ErrorReason>> = {
  [ChannelField.Token]: ErrorReason.TelegramTokenInvalid,
  [ChannelField.AgentId]: ErrorReason.InvalidRequest,
  [ChannelField.ShowTyping]: ErrorReason.InvalidRequest,
};

export enum ChannelGraphqlArgument {
  Input = 'input',
}
