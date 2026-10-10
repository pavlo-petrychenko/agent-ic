import type {
  MessageAuthor,
  MessageDelivery,
} from '@/modules/conversations/constants/message.constants';

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
