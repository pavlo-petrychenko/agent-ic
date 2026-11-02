import {
  ChannelKind,
  ConversationState,
} from '@/modules/conversations/constants/conversation.constants';
import { toGraphqlMessage } from '@/modules/conversations/helpers/simulation-graphql.helpers';
import type { InboxDetail, InboxSummary } from '@/modules/conversations/typedefs/inbox.typedefs';
import type {
  InboxConversationDetail,
  InboxConversationSummary,
} from '@/platform/graphql-server/generated/schema.generated';
import {
  ChannelConversationKind as GraphqlChannelConversationKind,
  ConversationState as GraphqlConversationState,
} from '@/platform/graphql-server/generated/schema.generated';

const GRAPHQL_CONVERSATION_STATE: Readonly<Record<ConversationState, GraphqlConversationState>> = {
  [ConversationState.AgentActive]: GraphqlConversationState.AgentActive,
  [ConversationState.Waiting]: GraphqlConversationState.Waiting,
  [ConversationState.Handled]: GraphqlConversationState.Handled,
  [ConversationState.Closed]: GraphqlConversationState.Closed,
};

const GRAPHQL_CHANNEL_KIND: Readonly<Record<ChannelKind, GraphqlChannelConversationKind>> = {
  [ChannelKind.Simulated]: GraphqlChannelConversationKind.Simulated,
  [ChannelKind.Telegram]: GraphqlChannelConversationKind.Telegram,
  [ChannelKind.Api]: GraphqlChannelConversationKind.Api,
};

export const toGraphqlInboxSummary = (summary: InboxSummary): InboxConversationSummary => ({
  id: summary.id,
  state: GRAPHQL_CONVERSATION_STATE[summary.state],
  handledByMe: summary.handledByMe,
  channelKind: GRAPHQL_CHANNEL_KIND[summary.channelKind],
  agentId: summary.agentId,
  agentName: summary.agentName,
  agentVersion: summary.agentVersion,
  endUserName: summary.endUserName,
  endUserExternalId: summary.endUserExternalId,
  preview: summary.preview,
  createdAt: summary.createdAt.toISOString(),
  lastMessageAt: summary.lastMessageAt.toISOString(),
  lastEscalatedAt: summary.lastEscalatedAt?.toISOString() ?? null,
  closedAt: summary.closedAt?.toISOString() ?? null,
});

export const toGraphqlInboxDetail = (detail: InboxDetail): InboxConversationDetail => ({
  summary: toGraphqlInboxSummary(detail.summary),
  messages: detail.messages.map(toGraphqlMessage),
});
