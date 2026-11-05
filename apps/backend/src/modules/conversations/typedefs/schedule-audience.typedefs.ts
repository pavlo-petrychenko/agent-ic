import type { ChannelKind } from '@agent-ic/contracts';
import type { TriggerScheduleNode } from '@agent-ic/flow';
import type { scheduleContacts } from '@/modules/conversations/db/schedule-contacts.table';

export interface ScheduleAudienceRequest {
  readonly agentId: string;
  readonly node: TriggerScheduleNode;
  readonly tick: Date;
}

export interface ScheduleContactRequest extends ScheduleAudienceRequest {
  readonly conversationId: string;
}

export interface ScheduleCandidateQuery {
  readonly agentId: string;
  readonly nodeId: string;
  readonly tick: Date;
  readonly silentSince: Date | null;
  readonly notEscalated: boolean;
  readonly channelKinds: readonly ChannelKind[];
  readonly oncePerConversation: boolean;
  readonly limit: number;
}

export type NewScheduleContact = Omit<typeof scheduleContacts.$inferInsert, 'createdAt'>;
