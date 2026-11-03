import {
  API_CHANNEL_EXAMPLE_ANSWER,
  API_CHANNEL_EXAMPLE_CONVERSATION_ID,
  API_CHANNEL_EXAMPLE_TEXT,
  API_CHANNEL_EXAMPLE_USER_ID,
  API_CHANNEL_HTTP_METHOD,
} from '@/features/channels/constants/apiChannel.constants';
import { TELEGRAM_STATUS } from '@/features/channels/constants/telegram.constants';
import type {
  ApiChannelSummary,
  ApiChannelView,
  ApiReplyMode,
} from '@/features/channels/typedefs/apiChannel.typedefs';
import { ApiReplyMode as WebApiReplyMode } from '@/features/channels/typedefs/apiChannel.typedefs';
import type {
  ChannelAgent,
  ChannelDetail,
  ChannelSummary,
} from '@/features/channels/typedefs/channels.typedefs';
import {
  type TelegramChannelSummary,
  type TelegramChannelView,
} from '@/features/channels/typedefs/telegram.typedefs';
import {
  ApiReplyMode as GraphqlApiReplyMode,
  ChannelKind as ApiChannelKind,
} from '@/shared/api/generated/schema.generated';

export const isTelegramChannel = (channel: { readonly kind: ApiChannelKind }): boolean =>
  channel.kind === ApiChannelKind.Telegram;

export const isApiChannel = (channel: { readonly kind: ApiChannelKind }): boolean =>
  channel.kind === ApiChannelKind.Api;

const GRAPHQL_API_REPLY_MODE: Readonly<Record<GraphqlApiReplyMode, ApiReplyMode>> = {
  [GraphqlApiReplyMode.Response]: WebApiReplyMode.Response,
  [GraphqlApiReplyMode.Webhook]: WebApiReplyMode.Webhook,
};

const toApiReplyMode = (replyMode: GraphqlApiReplyMode | null): ApiReplyMode =>
  replyMode === null ? WebApiReplyMode.Response : GRAPHQL_API_REPLY_MODE[replyMode];

const telegramHandle = (username: string): string =>
  username.startsWith('@') ? username : `@${username}`;

export const toTelegramChannelSummary = (
  channel: ChannelSummary,
  agentName: string | null,
): TelegramChannelSummary => ({
  id: channel.id,
  displayName: telegramHandle(channel.displayName),
  status: TELEGRAM_STATUS[channel.status],
  agentId: channel.agentId,
  agentName,
});

export const toTelegramChannelView = (
  channel: ChannelDetail,
  agent: ChannelAgent | null,
): TelegramChannelView => ({
  ...toTelegramChannelSummary(channel, agent?.name ?? null),
  firstName: channel.firstName,
  tokenMasked: channel.tokenMasked,
  agentLiveVersionNumber: agent?.liveVersionNumber ?? null,
  showTyping: channel.showTyping,
  updatedAt: channel.updatedAt,
  updatedByName: channel.updatedByName,
});

export const toApiChannelSummary = (
  channel: Pick<ChannelSummary, 'id' | 'displayName' | 'agentId' | 'replyMode'>,
  agentName: string | null,
): ApiChannelSummary => ({
  id: channel.id,
  name: channel.displayName,
  agentId: channel.agentId,
  agentName,
  replyMode: toApiReplyMode(channel.replyMode),
});

const apiChannelExampleRequest = (endpoint: string): string =>
  `curl -X ${API_CHANNEL_HTTP_METHOD} ${endpoint} \\
  -H "Authorization: Bearer $KEY" \\
  -d '{ "user_id": "${API_CHANNEL_EXAMPLE_USER_ID}",
        "text": "${API_CHANNEL_EXAMPLE_TEXT}" }'`;

const apiChannelExampleResponse = (replyMode: ApiReplyMode): string =>
  replyMode === WebApiReplyMode.Webhook
    ? `{ "status": "accepted" }`
    : `{ "conversation_id": "${API_CHANNEL_EXAMPLE_CONVERSATION_ID}",
  "messages": [
    "${API_CHANNEL_EXAMPLE_ANSWER}"
  ],
  "status": "answered" }`;

export const toApiChannelView = (
  channel: ChannelDetail,
  agent: ChannelAgent | null,
): ApiChannelView => {
  const endpoint = channel.endpoint ?? '';
  const replyMode = toApiReplyMode(channel.replyMode);
  return {
    ...toApiChannelSummary(channel, agent?.name ?? null),
    endpoint: endpoint === '' ? '' : `${API_CHANNEL_HTTP_METHOD} ${endpoint}`,
    secretMasked: channel.tokenMasked ?? '',
    showTyping: channel.showTyping,
    webhook: channel.webhook,
    updatedAt: channel.updatedAt,
    updatedByName: channel.updatedByName,
    exampleRequest: endpoint === '' ? '' : apiChannelExampleRequest(endpoint),
    exampleResponse: apiChannelExampleResponse(replyMode),
  };
};
