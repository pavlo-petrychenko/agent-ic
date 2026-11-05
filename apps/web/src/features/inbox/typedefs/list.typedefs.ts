import type { InboxRowStatusKind, InboxTab } from '@/features/inbox/constants/inbox.constants';
import type { InboxTranslate } from '@/features/inbox/typedefs/common.typedefs';
import type { InboxConversation } from '@/features/inbox/typedefs/conversation.typedefs';
import type { EmptyStateTone } from '@/shared/ui/display/EmptyState';
import type { IconName } from '@/shared/ui/foundations/Icon';

export interface InboxFilters {
  readonly channelIds: readonly string[];
  readonly agentIds: readonly string[];
}

export interface InboxTabItem {
  readonly id: InboxTab;
  readonly label: string;
  readonly count: number;
}

export interface InboxRowStatus {
  readonly kind: InboxRowStatusKind;
  readonly label: string;
}

export type InboxRowStatusResolver = (
  conversation: InboxConversation,
  t: InboxTranslate,
) => InboxRowStatus | null;

export interface InboxListItem {
  readonly id: string;
  readonly name: string;
  readonly initials: string;
  readonly preview: string;
  readonly updated: string;
  readonly source: string;
  readonly status: InboxRowStatus | null;
  readonly selected: boolean;
}

export interface InboxEmptyState {
  readonly title: string;
  readonly description: string;
  readonly icon: IconName;
  readonly tone: EmptyStateTone;
}

export type InboxEmptyStateResolver = (t: InboxTranslate) => InboxEmptyState;
