import { CHANNEL_KINDS } from '@agent-ic/contracts';
import {
  CONVERSATIONS_SCHEMA,
  ConversationMode,
  ConversationState,
} from '@/modules/conversations/constants/conversation.constants';
import {
  MessageAuthor,
  MessageDelivery,
} from '@/modules/conversations/constants/message.constants';
import { moduleSchema } from '@/platform/database/helpers/tenant-table.helpers';

export const conversationsSchema = moduleSchema(CONVERSATIONS_SCHEMA);

export const conversationModeEnum = conversationsSchema.enum('conversation_mode', [
  ConversationMode.Live,
  ConversationMode.Simulation,
]);

export const conversationStateEnum = conversationsSchema.enum('conversation_state', [
  ConversationState.AgentActive,
  ConversationState.Waiting,
  ConversationState.Handled,
  ConversationState.Closed,
]);

export const channelKindEnum = conversationsSchema.enum('channel_kind', CHANNEL_KINDS);

export const messageAuthorEnum = conversationsSchema.enum('message_author', [
  MessageAuthor.Customer,
  MessageAuthor.Agent,
  MessageAuthor.Operator,
  MessageAuthor.System,
]);

export const messageDeliveryEnum = conversationsSchema.enum('message_delivery', [
  MessageDelivery.Pending,
  MessageDelivery.Delivered,
  MessageDelivery.Failed,
]);
