import {
  ChannelKind,
  CloseReason,
  ConversationState,
} from '@/modules/conversations/constants/conversation.constants';
import { MessageAuthor } from '@/modules/conversations/constants/message.constants';
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

export const toGraphqlConversation = (conversation: ConversationView): Conversation => ({
  ...conversation,
  state: GRAPHQL_CONVERSATION_STATE[conversation.state],
  channelKind: GRAPHQL_CHANNEL_CONVERSATION_KIND[conversation.channelKind],
  closeReason:
    conversation.closeReason === null ? null : GRAPHQL_CLOSE_REASON[conversation.closeReason],
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
  createdAt: message.createdAt.toISOString(),
});

export const toGraphqlSimulation = (simulation: SimulationView): Simulation => ({
  conversation: toGraphqlConversation(simulation.conversation),
  messages: simulation.messages.map(toGraphqlMessage),
  runs: [],
});
