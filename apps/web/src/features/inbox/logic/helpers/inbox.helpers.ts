import {
  INBOX_TAB_BY_REPLY_STATE,
  INBOX_TABS,
  type InboxProvider,
  type InboxTab,
} from '@/features/inbox/constants/inbox.constants';
import type { InboxConversation } from '@/features/inbox/typedefs/conversation.typedefs';
import type { InboxFilters } from '@/features/inbox/typedefs/list.typedefs';

export const inboxTabOf = (conversation: InboxConversation): InboxTab =>
  INBOX_TAB_BY_REPLY_STATE[conversation.replyState];

export const countConversationsByTab = (
  conversations: readonly InboxConversation[],
): Readonly<Record<InboxTab, number>> => {
  const counts = Object.fromEntries(INBOX_TABS.map((tab) => [tab, 0])) as Record<InboxTab, number>;
  for (const conversation of conversations) {
    counts[inboxTabOf(conversation)] += 1;
  }
  return counts;
};

export const matchesInboxFilters = (
  conversation: InboxConversation,
  filters: InboxFilters,
): boolean =>
  (filters.channelIds.length === 0 ||
    (conversation.channelId !== null && filters.channelIds.includes(conversation.channelId))) &&
  (filters.agentIds.length === 0 || filters.agentIds.includes(conversation.agentId));

export const matchesConversationQuery = (
  conversation: InboxConversation,
  query: string,
  providerLabels: Readonly<Record<InboxProvider, string>>,
): boolean => {
  const needle = query.trim().toLocaleLowerCase();
  if (needle === '') {
    return true;
  }
  return [
    conversation.name,
    conversation.preview,
    conversation.agentName,
    conversation.facts.channel,
    providerLabels[conversation.provider],
  ]
    .join(' ')
    .toLocaleLowerCase()
    .includes(needle);
};

export const visibleConversations = (
  conversations: readonly InboxConversation[],
  tab: InboxTab,
  query: string,
  providerLabels: Readonly<Record<InboxProvider, string>>,
): readonly InboxConversation[] =>
  conversations.filter(
    (conversation) =>
      inboxTabOf(conversation) === tab &&
      matchesConversationQuery(conversation, query, providerLabels),
  );
