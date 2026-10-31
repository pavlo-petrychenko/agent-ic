import { ChannelKind } from '@agent-ic/contracts';
import { ApiReplyMode, ChannelStatus } from '@/modules/channels/constants/channel.constants';
import type {
  ApiChannelSecretResult,
  ChannelRecord,
  ChannelView,
  ConnectTelegramInput,
  CreateApiChannelInput,
  ReplaceTelegramTokenInput,
  UpdateChannelInput,
} from '@/modules/channels/typedefs/channel.typedefs';
import type {
  ApiChannelSecret as GraphqlApiChannelSecret,
  Channel as GraphqlChannel,
  ConnectTelegramInput as GraphqlConnectTelegramInput,
  CreateApiChannelInput as GraphqlCreateApiChannelInput,
  ReplaceTelegramTokenInput as GraphqlReplaceTelegramTokenInput,
  UpdateChannelInput as GraphqlUpdateChannelInput,
} from '@/platform/graphql-server/generated/schema.generated';
import {
  ApiReplyMode as GraphqlApiReplyMode,
  ChannelKind as GraphqlChannelKind,
  ChannelStatus as GraphqlChannelStatus,
} from '@/platform/graphql-server/generated/schema.generated';

const GRAPHQL_CHANNEL_KIND: Readonly<Record<ChannelRecord['kind'], GraphqlChannelKind>> = {
  [ChannelKind.Telegram]: GraphqlChannelKind.Telegram,
  [ChannelKind.Api]: GraphqlChannelKind.Api,
};

const GRAPHQL_CHANNEL_STATUS: Readonly<Record<ChannelRecord['status'], GraphqlChannelStatus>> = {
  [ChannelStatus.Pending]: GraphqlChannelStatus.Pending,
  [ChannelStatus.Connected]: GraphqlChannelStatus.Connected,
  [ChannelStatus.Broken]: GraphqlChannelStatus.Broken,
  [ChannelStatus.Disconnected]: GraphqlChannelStatus.Disconnected,
};

const GRAPHQL_API_REPLY_MODE: Readonly<Record<ApiReplyMode, GraphqlApiReplyMode>> = {
  [ApiReplyMode.Response]: GraphqlApiReplyMode.Response,
  [ApiReplyMode.Webhook]: GraphqlApiReplyMode.Webhook,
};

const API_REPLY_MODE: Readonly<Record<GraphqlApiReplyMode, ApiReplyMode>> = {
  [GraphqlApiReplyMode.Response]: ApiReplyMode.Response,
  [GraphqlApiReplyMode.Webhook]: ApiReplyMode.Webhook,
};

export const toGraphqlChannel = (channel: ChannelView): GraphqlChannel => ({
  ...channel,
  kind: GRAPHQL_CHANNEL_KIND[channel.kind],
  status: GRAPHQL_CHANNEL_STATUS[channel.status],
  replyMode: channel.replyMode === null ? null : GRAPHQL_API_REPLY_MODE[channel.replyMode],
  createdAt: channel.createdAt.toISOString(),
  updatedAt: channel.updatedAt.toISOString(),
});

export const toGraphqlApiChannelSecret = (
  result: ApiChannelSecretResult,
): GraphqlApiChannelSecret => ({
  channel: toGraphqlChannel(result.channel),
  secret: result.secret,
});

export const toConnectTelegramInput = (
  input: GraphqlConnectTelegramInput,
): ConnectTelegramInput => ({
  token: input.token,
  agentId: input.agentId,
  showTyping: input.showTyping ?? true,
});

export const toCreateApiChannelInput = (
  input: GraphqlCreateApiChannelInput,
): CreateApiChannelInput => ({
  name: input.name,
  agentId: input.agentId,
  replyMode: API_REPLY_MODE[input.replyMode],
  webhook: input.webhook ?? null,
});

export const toUpdateChannelInput = (input: GraphqlUpdateChannelInput): UpdateChannelInput => ({
  id: input.id,
  agentId: input.agentId,
  showTyping: input.showTyping,
  replyMode: input.replyMode === null ? null : API_REPLY_MODE[input.replyMode],
  webhook: input.webhook ?? null,
});

export const toReplaceTelegramTokenInput = (
  input: GraphqlReplaceTelegramTokenInput,
): ReplaceTelegramTokenInput => ({
  id: input.id,
  token: input.token,
});
