import {
  ChannelKind,
  ConversationState,
} from '@/modules/conversations/constants/conversation.constants';
import { MessageAuthor } from '@/modules/conversations/constants/message.constants';
import type {
  ConversationView,
  MessageView,
  SimulationView,
} from '@/modules/conversations/typedefs/simulation.typedefs';
import type {
  Conversation,
  Message,
  Simulation,
} from '@/platform/graphql-server/generated/schema.generated';
import {
  ChannelKind as GraphqlChannelKind,
  ConversationState as GraphqlConversationState,
  MessageAuthor as GraphqlMessageAuthor,
} from '@/platform/graphql-server/generated/schema.generated';

const GRAPHQL_CONVERSATION_STATE: Readonly<Record<ConversationState, GraphqlConversationState>> = {
  [ConversationState.AgentActive]: GraphqlConversationState.AgentActive,
  [ConversationState.Waiting]: GraphqlConversationState.Waiting,
  [ConversationState.Handled]: GraphqlConversationState.Handled,
  [ConversationState.Closed]: GraphqlConversationState.Closed,
};

const GRAPHQL_CHANNEL_KIND: Readonly<Record<ChannelKind, GraphqlChannelKind>> = {
  [ChannelKind.Simulated]: GraphqlChannelKind.Simulated,
  [ChannelKind.Telegram]: GraphqlChannelKind.Telegram,
  [ChannelKind.Api]: GraphqlChannelKind.Api,
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
  channelKind: GRAPHQL_CHANNEL_KIND[conversation.channelKind],
  createdAt: conversation.createdAt.toISOString(),
});

export const toGraphqlMessage = (message: MessageView): Message => ({
  ...message,
  author: GRAPHQL_MESSAGE_AUTHOR[message.author],
  createdAt: message.createdAt.toISOString(),
});

export const toGraphqlSimulation = (simulation: SimulationView): Simulation => ({
  conversation: toGraphqlConversation(simulation.conversation),
  messages: simulation.messages.map(toGraphqlMessage),
});
