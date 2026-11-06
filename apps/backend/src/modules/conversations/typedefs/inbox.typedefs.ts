import type {
  ChannelKind,
  ConversationState,
} from '@/modules/conversations/constants/conversation.constants';
import type { InboxQueue } from '@/modules/conversations/constants/inbox.constants';
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

export interface InboxConversationsCursor {
  readonly lastMessageAt: string;
  readonly id: string;
}

export interface InboxFilter {
  readonly channelIds: readonly string[];
  readonly agentIds: readonly string[];
  readonly search: string | null;
}

export interface InboxListFilter extends InboxFilter {
  readonly states: readonly ConversationState[];
}

export interface InboxConversationsInput extends InboxFilter {
  readonly limit: number | null;
  readonly after?: InboxConversationsCursor | null;
  readonly queue: InboxQueue;
}

export type InboxCountsInput = InboxFilter;

export interface InboxFilterOptions {
  readonly channelRefs: readonly string[];
  readonly agentRefs: readonly string[];
}

export interface InboxCounts {
  readonly needsYou: number;
  readonly live: number;
  readonly closed: number;
}

export interface InboxConversationInput {
  readonly id: string;
}
