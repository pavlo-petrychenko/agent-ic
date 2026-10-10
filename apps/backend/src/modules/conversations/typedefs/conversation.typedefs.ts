import type {
  ChannelKind,
  ConversationMode,
  ConversationState,
  WaitingReason,
} from '@/modules/conversations/constants/conversation.constants';
import type { conversations } from '@/modules/conversations/db/conversations.table';

export interface Conversation {
  readonly id: string;
  readonly workspaceId: string;
  readonly agentId: string;
  readonly mode: ConversationMode;
  readonly channelKind: ChannelKind;
  readonly channelId: string | null;
  readonly endUserExternalId: string;
  readonly endUserName: string | null;
  readonly state: ConversationState;
  readonly handledBy: string | null;
  readonly activeRunId: string | null;
  readonly awaySentAt: Date | null;
  readonly lastMessageAt: Date;
  readonly closedAt: Date | null;
  readonly createdAt: Date;
}

export type NewConversation = typeof conversations.$inferInsert;

export interface WaitingRequest {
  readonly workspaceId: string;
  readonly conversationId: string;
  readonly reason: WaitingReason;
}

export interface EndUserConversationKey {
  readonly workspaceId: string;
  readonly agentId: string;
  readonly mode: ConversationMode;
  readonly channelKind: ChannelKind;
  readonly endUserExternalId: string;
}
