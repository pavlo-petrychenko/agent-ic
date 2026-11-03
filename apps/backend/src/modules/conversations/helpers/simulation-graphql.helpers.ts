import {
  ChannelKind,
  CloseReason,
  ConversationState,
} from '@/modules/conversations/constants/conversation.constants';
import {
  MessageAuthor,
  MessageSystemEvent,
} from '@/modules/conversations/constants/message.constants';
import type {
  ConversationView,
  MessageView,
  SimulationView,
  StartSimulationInput,
} from '@/modules/conversations/typedefs/simulation.typedefs';
import type {
  Conversation,
  Message,
  Simulation,
  StartSimulationInput as GraphqlStartSimulationInput,
} from '@/platform/graphql-server/generated/schema.generated';
import {
  ChannelConversationKind as GraphqlChannelConversationKind,
  ConversationCloseReason as GraphqlConversationCloseReason,
  ConversationState as GraphqlConversationState,
  MessageAuthor as GraphqlMessageAuthor,
  MessageSystemEvent as GraphqlMessageSystemEvent,
} from '@/platform/graphql-server/generated/schema.generated';

const GRAPHQL_CONVERSATION_STATE: Readonly<Record<ConversationState, GraphqlConversationState>> = {
  [ConversationState.AgentActive]: GraphqlConversationState.AgentActive,
  [ConversationState.Waiting]: GraphqlConversationState.Waiting,
  [ConversationState.Handled]: GraphqlConversationState.Handled,
  [ConversationState.Closed]: GraphqlConversationState.Closed,
};

const GRAPHQL_CLOSE_REASON: Readonly<Record<CloseReason, GraphqlConversationCloseReason>> = {
  [CloseReason.EndedByAgent]: GraphqlConversationCloseReason.EndedByAgent,
  [CloseReason.Inactivity]: GraphqlConversationCloseReason.Inactivity,
  [CloseReason.ClosedByOperator]: GraphqlConversationCloseReason.ClosedByOperator,
};

const GRAPHQL_CHANNEL_CONVERSATION_KIND: Readonly<
  Record<ChannelKind, GraphqlChannelConversationKind>
> = {
  [ChannelKind.Simulated]: GraphqlChannelConversationKind.Simulated,
  [ChannelKind.Telegram]: GraphqlChannelConversationKind.Telegram,
  [ChannelKind.Api]: GraphqlChannelConversationKind.Api,
};

const CHANNEL_KIND_FROM_GRAPHQL: Readonly<Record<GraphqlChannelConversationKind, ChannelKind>> = {
  [GraphqlChannelConversationKind.Simulated]: ChannelKind.Simulated,
  [GraphqlChannelConversationKind.Telegram]: ChannelKind.Telegram,
  [GraphqlChannelConversationKind.Api]: ChannelKind.Api,
};

const GRAPHQL_MESSAGE_AUTHOR: Readonly<Record<MessageAuthor, GraphqlMessageAuthor>> = {
  [MessageAuthor.Customer]: GraphqlMessageAuthor.Customer,
  [MessageAuthor.Agent]: GraphqlMessageAuthor.Agent,
  [MessageAuthor.Operator]: GraphqlMessageAuthor.Operator,
  [MessageAuthor.System]: GraphqlMessageAuthor.System,
};

const GRAPHQL_MESSAGE_SYSTEM_EVENT: Readonly<
  Record<MessageSystemEvent, GraphqlMessageSystemEvent>
> = {
  [MessageSystemEvent.Escalated]: GraphqlMessageSystemEvent.Escalated,
  [MessageSystemEvent.TookOver]: GraphqlMessageSystemEvent.TookOver,
  [MessageSystemEvent.HandedBack]: GraphqlMessageSystemEvent.HandedBack,
};

export const toGraphqlConversation = (conversation: ConversationView): Conversation => ({
  ...conversation,
  state: GRAPHQL_CONVERSATION_STATE[conversation.state],
  channelKind: GRAPHQL_CHANNEL_CONVERSATION_KIND[conversation.channelKind],
  closeReason:
    conversation.closeReason === null ? null : GRAPHQL_CLOSE_REASON[conversation.closeReason],
  closedAt: conversation.closedAt?.toISOString() ?? null,
  createdAt: conversation.createdAt.toISOString(),
});

export const toStartSimulationInput = (
  input: GraphqlStartSimulationInput,
): StartSimulationInput => ({
  agentId: input.agentId,
  versionId: input.versionId,
  channelKind: CHANNEL_KIND_FROM_GRAPHQL[input.channelKind],
  language: input.language,
});

export const toGraphqlMessage = (message: MessageView): Message => ({
  ...message,
  author: GRAPHQL_MESSAGE_AUTHOR[message.author],
  systemEvent:
    message.systemEvent === null ? null : GRAPHQL_MESSAGE_SYSTEM_EVENT[message.systemEvent],
  createdAt: message.createdAt.toISOString(),
});

export const toGraphqlSimulation = (simulation: SimulationView): Simulation => ({
  conversation: toGraphqlConversation(simulation.conversation),
  messages: simulation.messages.map(toGraphqlMessage),
  runs: [],
});
