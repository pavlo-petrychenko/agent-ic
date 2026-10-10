export {
  ChannelKind,
  ConversationMode,
  ConversationState,
  WaitingReason,
} from '@/modules/conversations/constants/conversation.constants';
export {
  MessageAuthor,
  MessageDelivery,
} from '@/modules/conversations/constants/message.constants';
export { ConversationsModule } from '@/modules/conversations/conversations.module';
export { ConversationClosedError } from '@/modules/conversations/errors/conversation-closed.error';
export { ConversationNotFoundError } from '@/modules/conversations/errors/conversation-not-found.error';
export { MessageNotFoundError } from '@/modules/conversations/errors/message-not-found.error';
export { messageReceivedEvent } from '@/modules/conversations/events/message-received.event';
export { needsOperatorEvent } from '@/modules/conversations/events/needs-operator.event';
export { outboundQueuedEvent } from '@/modules/conversations/events/outbound-queued.event';
export { ConversationHistoryService } from '@/modules/conversations/services/conversation-history.service';
export type {
  MessageReceivedPayload,
  NeedsOperatorPayload,
  OutboundQueuedPayload,
} from '@/modules/conversations/typedefs/conversation-event.typedefs';
export type { Conversation } from '@/modules/conversations/typedefs/conversation.typedefs';
export type { Message } from '@/modules/conversations/typedefs/message.typedefs';
