import type {
  ChannelKind,
  ConversationMode,
} from '@/modules/conversations/constants/conversation.constants';
import type { IncomingMessageOutcome } from '@/modules/conversations/constants/incoming-message.constants';

export interface IncomingMessageInput {
  readonly workspaceId: string;
  readonly agentId: string;
  readonly mode: ConversationMode;
  readonly channelKind: ChannelKind;
  readonly channelId: string | null;
  readonly endUserExternalId: string;
  readonly endUserName: string | null;
  readonly externalId: string | null;
  readonly text: string;
  readonly versionId: string | null;
}

export interface IncomingMessageResult {
  readonly outcome: IncomingMessageOutcome;
  readonly conversationId: string;
  readonly messageId: string | null;
}
