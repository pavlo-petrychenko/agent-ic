import {
  INBOX_MINUTES_PER_DAY,
  INBOX_TABS,
  InboxReplyState,
  InboxRowStatusKind,
  InboxTab,
} from '@/features/inbox/constants/inbox.constants';
import type {
  InboxConversation,
  InboxEmptyState,
  InboxListItem,
  InboxProviderLabels,
  InboxRowStatus,
  InboxTabItem,
  InboxTranslate,
} from '@/features/inbox/typedefs/inbox.typedefs';
import { EmptyStateTone } from '@/shared/ui/display/EmptyState';
import { IconName } from '@/shared/ui/foundations/Icon';

type InboxRowStatusResolver = (
  conversation: InboxConversation,
  t: InboxTranslate,
) => InboxRowStatus | null;

type InboxEmptyStateResolver = (t: InboxTranslate) => InboxEmptyState;

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

const inboxUpdatedLabel = (minutesAgo: number, t: InboxTranslate): string => {
  const days = Math.floor(minutesAgo / INBOX_MINUTES_PER_DAY);
  if (days > 0) {
    return t('daysAgo', { count: days });
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

export const inboxEmptyState = (tab: InboxTab, t: InboxTranslate): InboxEmptyState =>
  INBOX_EMPTY_STATES[tab](t);
