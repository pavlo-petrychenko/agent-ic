import {
  ChannelKind,
  ConversationState,
} from '@/modules/conversations/constants/conversation.constants';
import { InboxQueue } from '@/modules/conversations/constants/inbox.constants';
import { toGraphqlMessage } from '@/modules/conversations/helpers/simulation-graphql.helpers';
import type {
  InboxConversationDetailParent,
  InboxSummaryParent,
} from '@/modules/conversations/typedefs/inbox-graphql.typedefs';
import type {
  InboxConversationsInput,
  InboxCountsInput,
  InboxDetail,
  InboxSummary,
} from '@/modules/conversations/typedefs/inbox.typedefs';
import {
  ChannelConversationKind as GraphqlChannelConversationKind,
  ConversationState as GraphqlConversationState,
  InboxQueue as GraphqlInboxQueue,
} from '@/platform/graphql-server/generated/schema.generated';
import type {
  InboxConversationsInput as GraphqlInboxConversationsInput,
  InboxCountsInput as GraphqlInboxCountsInput,
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

const INBOX_QUEUE_FROM_GRAPHQL: Readonly<Record<GraphqlInboxQueue, InboxQueue>> = {
  [GraphqlInboxQueue.NeedsYou]: InboxQueue.NeedsYou,
  [GraphqlInboxQueue.Live]: InboxQueue.Live,
  [GraphqlInboxQueue.Closed]: InboxQueue.Closed,
};

export const toInboxConversationsInput = (
  input: GraphqlInboxConversationsInput,
): InboxConversationsInput => ({
  limit: input.limit,
  after: input.after ?? null,
  queue: INBOX_QUEUE_FROM_GRAPHQL[input.queue],
  channelIds: input.channelIds ?? [],
  agentIds: input.agentIds ?? [],
  search: input.search ?? null,
});

export const toInboxCountsInput = (input: GraphqlInboxCountsInput | null): InboxCountsInput => ({
  channelIds: input?.channelIds ?? [],
  agentIds: input?.agentIds ?? [],
  search: input?.search ?? null,
});

export const toGraphqlInboxSummary = (summary: InboxSummary): InboxSummaryParent => ({
  id: summary.id,
  state: GRAPHQL_CONVERSATION_STATE[summary.state],
  handledByMe: summary.handledByMe,
  handledByName: summary.handledByName,
  hasBeenHandled: summary.hasBeenHandled,
  channelKind: GRAPHQL_CHANNEL_KIND[summary.channelKind],
  channelId: summary.channelId,
  channelRef: summary.channelRef,
  agentId: summary.agentId,
  agentName: summary.agentName,
  agentVersion: summary.agentVersion,
  endUserName: summary.endUserName,
  endUserExternalId: summary.endUserExternalId,
  preview: summary.preview,
  createdAt: summary.createdAt.toISOString(),
  lastMessageAt: summary.lastMessageAt.toISOString(),
  lastEscalatedAt: summary.lastEscalatedAt?.toISOString() ?? null,
  waitingSince: summary.waitingSince?.toISOString() ?? null,
  closedAt: summary.closedAt?.toISOString() ?? null,
});

export const toGraphqlInboxDetail = (detail: InboxDetail): InboxConversationDetailParent => ({
  summary: toGraphqlInboxSummary(detail.summary),
  messages: detail.messages.map(toGraphqlMessage),
});
