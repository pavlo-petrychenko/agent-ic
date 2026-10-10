import type { Conversation } from '@/modules/conversations/typedefs/conversation.typedefs';
import type { Message } from '@/modules/conversations/typedefs/message.typedefs';

export interface SeededAgent {
  readonly agentId: string;
  readonly draftId: string;
}

export interface SeededConversation {
  readonly conversationId: string;
  readonly messageId: string;
}

export interface StoredConversation {
  readonly conversation: Conversation | null;
  readonly message: Message | null;
}
