import type {
  ChannelKind,
  ConversationState,
} from '@/modules/conversations/constants/conversation.constants';
import type { MessageView } from '@/modules/conversations/typedefs/simulation.typedefs';

export interface InboxSummary {
  readonly id: string;
  readonly state: ConversationState;
  readonly handledByMe: boolean;
  readonly handledByName: string | null;
  readonly hasBeenHandled: boolean;
  readonly channelKind: ChannelKind;
  readonly channelId: string | null;
  readonly channelRef: string | null;
  readonly agentId: string;
  readonly agentName: string;
  readonly agentVersion: number;
  readonly endUserName: string | null;
  readonly endUserExternalId: string;
  readonly preview: string;
  readonly createdAt: Date;
  readonly lastMessageAt: Date;
  readonly lastEscalatedAt: Date | null;
  readonly closedAt: Date | null;
}

export interface InboxDetail {
  readonly summary: InboxSummary;
  readonly messages: readonly MessageView[];
}

export interface InboxConversationsInput {
  readonly limit: number | null;
}

export interface InboxConversationInput {
  readonly id: string;
}
