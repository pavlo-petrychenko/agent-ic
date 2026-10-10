import type {
  MessageAuthor,
  MessageDelivery,
} from '@/modules/conversations/constants/message.constants';
import type { messages } from '@/modules/conversations/db/messages.table';
import type { Conversation } from '@/modules/conversations/typedefs/conversation.typedefs';

export interface Message {
  readonly id: string;
  readonly workspaceId: string;
  readonly conversationId: string;
  readonly author: MessageAuthor;
  readonly text: string;
  readonly quickReplies: readonly string[];
  readonly externalId: string | null;
  readonly idempotencyKey: string | null;
  readonly delivery: MessageDelivery | null;
  readonly runId: string | null;
  readonly createdAt: Date;
}

export type NewMessage = typeof messages.$inferInsert;

export type MessagePosition = Pick<Message, 'id' | 'createdAt'>;

export interface OutboundMessageInput {
  readonly workspaceId: string;
  readonly conversationId: string;
  readonly key: string;
  readonly author: MessageAuthor;
  readonly text: string;
  readonly quickReplies: readonly string[];
  readonly runId: string | null;
}

export interface OutboundDelivery {
  readonly message: Message;
  readonly conversation: Conversation;
}
