import type {
  ChannelKind,
  ConversationMode,
  ConversationState,
} from '@/modules/conversations/constants/conversation.constants';

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
