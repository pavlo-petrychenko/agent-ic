import { ChannelKind } from '@agent-ic/contracts';
import { ChannelStatus } from '@/modules/channels/constants/channel.constants';
import type {
  ChannelRecord,
  ChannelView,
  ConnectTelegramInput,
  UpdateTelegramChannelInput,
} from '@/modules/channels/typedefs/channel.typedefs';
import type {
  Channel as GraphqlChannel,
  ConnectTelegramInput as GraphqlConnectTelegramInput,
  UpdateTelegramInput as GraphqlUpdateTelegramInput,
} from '@/platform/graphql-server/generated/schema.generated';
import {
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

export const toGraphqlChannel = (channel: ChannelView): GraphqlChannel => ({
  ...channel,
  kind: GRAPHQL_CHANNEL_KIND[channel.kind],
  status: GRAPHQL_CHANNEL_STATUS[channel.status],
  createdAt: channel.createdAt.toISOString(),
  updatedAt: channel.updatedAt.toISOString(),
});

export const toConnectTelegramInput = (
  input: GraphqlConnectTelegramInput,
): ConnectTelegramInput => ({
  token: input.token,
  agentId: input.agentId,
  showTyping: input.showTyping ?? true,
});

export const toUpdateTelegramInput = (
  input: GraphqlUpdateTelegramInput,
): UpdateTelegramChannelInput => ({
  id: input.id,
  agentId: input.agentId,
  showTyping: input.showTyping,
});
