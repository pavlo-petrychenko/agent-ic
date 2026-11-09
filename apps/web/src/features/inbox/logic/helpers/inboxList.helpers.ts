import {
  INBOX_MINUTES_PER_DAY,
  INBOX_MINUTES_PER_HOUR,
  INBOX_TABS,
  InboxReplyState,
  InboxRowStatusKind,
  InboxTab,
} from '@/features/inbox/constants/inbox.constants';
import type {
  InboxProviderLabels,
  InboxTranslate,
} from '@/features/inbox/typedefs/common.typedefs';
import type { InboxConversation } from '@/features/inbox/typedefs/conversation.typedefs';
import type {
  InboxEmptyState,
  InboxEmptyStateResolver,
  InboxListItem,
  InboxRowStatusResolver,
  InboxTabItem,
} from '@/features/inbox/typedefs/list.typedefs';
import type { FilterOption } from '@/shared/ui/data/FilterBar/FilterPicker';
import { EmptyStateTone } from '@/shared/ui/display/EmptyState';
import { IconName } from '@/shared/ui/foundations/Icon';

const INBOX_ROW_STATUS: Readonly<Record<InboxReplyState, InboxRowStatusResolver>> = {
  [InboxReplyState.Waiting]: (_conversation, t) => ({
    kind: InboxRowStatusKind.Waiting,
    label: t('status.waiting'),
  }),
  [InboxReplyState.Mine]: (_conversation, t) => ({
    kind: InboxRowStatusKind.Mine,
    label: t('status.you'),
  }),
  [InboxReplyState.Operator]: (conversation, t) => ({
    kind: InboxRowStatusKind.Operator,
    label: conversation.assigneeName ?? t('status.operator'),
  }),
  [InboxReplyState.Agent]: (_conversation, t) => ({
    kind: InboxRowStatusKind.Agent,
    label: t('status.agent'),
  }),
  [InboxReplyState.Closed]: () => null,
};

const INBOX_EMPTY_STATES: Readonly<Record<InboxTab, InboxEmptyStateResolver>> = {
  [InboxTab.NeedsYou]: (t) => ({
    title: t('empty.needsYou.title'),
    description: t('empty.needsYou.description'),
    icon: IconName.Check,
    tone: EmptyStateTone.Ok,
  }),
  [InboxTab.Live]: (t) => ({
    title: t('empty.live.title'),
    description: t('empty.live.description'),
    icon: IconName.Msg,
    tone: EmptyStateTone.Neutral,
  }),
  [InboxTab.Closed]: (t) => ({
    title: t('empty.closed.title'),
    description: t('empty.closed.description'),
    icon: IconName.Inbox,
    tone: EmptyStateTone.Neutral,
  }),
};

export const inboxTabItems = (
  counts: Readonly<Record<InboxTab, number>>,
  t: InboxTranslate,
): readonly InboxTabItem[] =>
  INBOX_TABS.map((tab) => ({
    id: tab,
    label: t(`tabs.${tab}`),
    count: counts[tab],
  }));

export const inboxUpdatedLabel = (minutesAgo: number, t: InboxTranslate): string => {
  const days = Math.floor(minutesAgo / INBOX_MINUTES_PER_DAY);
  if (days > 0) {
    return t('daysAgo', { count: days });
  }
  const hours = Math.floor(minutesAgo / INBOX_MINUTES_PER_HOUR);
  if (hours > 0) {
    return t('hoursAgo', { count: hours });
  }
  return minutesAgo === 0 ? t('now') : t('minutesAgo', { count: minutesAgo });
};

export const inboxListItem = (
  conversation: InboxConversation,
  selectedId: string | null,
  providerLabels: InboxProviderLabels,
  t: InboxTranslate,
): InboxListItem => ({
  id: conversation.id,
  name: conversation.name,
  initials: conversation.initials,
  preview: conversation.preview,
  updated: inboxUpdatedLabel(conversation.minutesAgo, t),
  source: `${providerLabels[conversation.provider]} · ${conversation.agentName}`,
  status: INBOX_ROW_STATUS[conversation.replyState](conversation, t),
  selected: conversation.id === selectedId,
});

export const inboxChannelOptions = (
  conversations: readonly InboxConversation[],
  providerLabels: InboxProviderLabels,
): readonly FilterOption[] => {
  const counts = new Map<string, { readonly label: string; count: number }>();
  for (const conversation of conversations) {
    if (conversation.channelId === null) {
      continue;
    }
    const current = counts.get(conversation.channelId);
    counts.set(conversation.channelId, {
      label: conversation.channelName ?? providerLabels[conversation.provider],
      count: (current?.count ?? 0) + 1,
    });
  }
  return [...counts.entries()]
    .map(([id, { label, count }]) => ({ id, label, count: String(count) }))
    .sort((left, right) => left.label.localeCompare(right.label));
};

export const inboxAgentOptions = (
  conversations: readonly InboxConversation[],
): readonly FilterOption[] => {
  const counts = new Map<string, { readonly label: string; count: number }>();
  for (const conversation of conversations) {
    const current = counts.get(conversation.agentId);
    counts.set(conversation.agentId, {
      label: conversation.agentName,
      count: (current?.count ?? 0) + 1,
    });
  }
  return [...counts.entries()]
    .map(([id, { label, count }]) => ({ id, label, count: String(count) }))
    .sort((left, right) => left.label.localeCompare(right.label));
};

export const inboxEmptyState = (
  tab: InboxTab,
  t: InboxTranslate,
  filtered: boolean,
): InboxEmptyState =>
  filtered
    ? {
        title: t('empty.filtered.title'),
        description: t('empty.filtered.description'),
        icon: IconName.Search,
        tone: EmptyStateTone.Neutral,
      }
    : INBOX_EMPTY_STATES[tab](t);
