import type { ChannelOutboundMessage } from '@/modules/channels/typedefs/channel-message.typedefs';
import { ChannelKind, ConversationMode } from '@/modules/conversations';
import type { Conversation, OutboundDelivery } from '@/modules/conversations';

export const deliveryChannelKind = (conversation: Conversation): ChannelKind =>
  conversation.mode === ConversationMode.Simulation
    ? ChannelKind.Simulated
    : conversation.channelKind;

export const toChannelOutboundMessage = ({
  message,
  conversation,
}: OutboundDelivery): ChannelOutboundMessage => ({
  messageId: message.id,
  conversationId: conversation.id,
  channelId: conversation.channelId,
  endUserExternalId: conversation.endUserExternalId,
  text: message.text,
  quickReplies: message.quickReplies,
});
