import type {
  InboxGuardKind,
  InboxNotifyChannel,
  InboxProvider,
  InboxReplyState,
  InboxReplyTarget,
  InboxTone,
} from '@/features/inbox/constants/inbox.constants';
import type { InboxStoredMessage } from '@/features/inbox/typedefs/message.typedefs';
import type { IconName } from '@/shared/ui/foundations/Icon';

export interface InboxGuard {
  readonly label: string;
  readonly kind: InboxGuardKind;
  readonly reason: string | null;
}

export interface InboxRunStep {
  readonly id: string;
  readonly icon: IconName;
  readonly tone: InboxTone;
  readonly label: string;
  readonly value: string | null;
}

export interface InboxRun {
  readonly id: string;
  readonly agentVersion: number | null;
  readonly time: string;
  readonly duration: string;
  readonly steps: readonly InboxRunStep[];
}

export interface InboxNotified {
  readonly names: readonly string[];
  readonly allOperators: boolean;
  readonly channels: readonly InboxNotifyChannel[];
}

export interface InboxConversationFacts {
  readonly channel: string;
  readonly startedAt: string | null;
  readonly escalatedAt: string | null;
  readonly waitingSince: string | null;
  readonly notified: InboxNotified | null;
  readonly runs: number | null;
  readonly handledBy: string | null;
  readonly handledSince: string | null;
  readonly handledUntil: string | null;
  readonly replyTarget: InboxReplyTarget | null;
  readonly closedAt: string | null;
  readonly agentAnswering: boolean;
}

export interface InboxConversation {
  readonly id: string;
  readonly name: string;
  readonly initials: string;
  readonly provider: InboxProvider;
  readonly channelId: string | null;
  readonly channelName: string | null;
  readonly agentId: string;
  readonly agentName: string;
  readonly agentVersion: number;
  readonly replyState: InboxReplyState;
  readonly hasBeenHandled: boolean;
  readonly assigneeName: string | null;
  readonly preview: string;
  readonly minutesAgo: number;
  readonly waitingMinutes: number | null;
  readonly messages: readonly InboxStoredMessage[];
  readonly guard: InboxGuard | null;
  readonly run: InboxRun | null;
  readonly facts: InboxConversationFacts;
}
