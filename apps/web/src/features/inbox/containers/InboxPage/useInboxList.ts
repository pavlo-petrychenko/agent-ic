import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toInboxConversation } from '@/features/inbox/communication/helpers/inboxConversationApi.helpers';
import { useInboxConversations } from '@/features/inbox/communication/hooks/useInboxConversations';
import { InboxProvider, InboxTab } from '@/features/inbox/constants/inbox.constants';
import { INBOX_NAMESPACE } from '@/features/inbox/constants/inboxI18n.constants';
import type { InboxListResult } from '@/features/inbox/containers/InboxPage/InboxPage.typedefs';
import {
  countConversationsByTab,
  firstConversationId,
  inboxTabOf,
  visibleConversations,
} from '@/features/inbox/logic/helpers/inbox.helpers';
import {
  inboxEmptyState,
  inboxListItem,
  inboxTabItems,
} from '@/features/inbox/logic/helpers/inboxList.helpers';
import type { InboxProviderLabels } from '@/features/inbox/typedefs/common.typedefs';

export function useInboxList(
  initialConversationId: string | null,
  onConversationChange?: (conversationId: string | null) => void,
): InboxListResult {
  const { t, i18n } = useTranslation(INBOX_NAMESPACE);
  const { summaries, loading, failed, retry } = useInboxConversations();
  const [selectedTab, setSelectedTab] = useState<InboxTab | null>(null);
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(initialConversationId);

  const conversations = useMemo(
    () =>
      summaries.map((summary) => toInboxConversation(summary, i18n.language, t('status.operator'))),
    [summaries, i18n.language, t],
  );

  const initialConversation = conversations.find(
    (conversation) => conversation.id === initialConversationId,
  );
  const activeTab =
    selectedTab ??
    (initialConversation === undefined ? InboxTab.NeedsYou : inboxTabOf(initialConversation));

  const providerLabels = useMemo<InboxProviderLabels>(
    () => ({
      [InboxProvider.Telegram]: t('provider.telegram'),
      [InboxProvider.Api]: t('provider.api'),
    }),
    [t],
  );

  const counts = useMemo(() => countConversationsByTab(conversations), [conversations]);
  const visible = useMemo(
    () => visibleConversations(conversations, activeTab, search, providerLabels),
    [conversations, activeTab, search, providerLabels],
  );

  const effectiveSelectedId =
    selectedId !== null && conversations.some((conversation) => conversation.id === selectedId)
      ? selectedId
      : (visible[0]?.id ?? null);

  const selectConversation = (conversationId: string | null) => {
    setSelectedId(conversationId);
    onConversationChange?.(conversationId);
  };

  const onTabChange = (tab: InboxTab) => {
    setSelectedTab(tab);
    const current = conversations.find((conversation) => conversation.id === effectiveSelectedId);
    if (current === undefined || inboxTabOf(current) !== tab) {
      selectConversation(firstConversationId(conversations, tab));
    }
  };

  return {
    conversations,
    providerLabels,
    counts,
    visible,
    activeTab,
    search,
    effectiveSelectedId,
    onSearchChange: setSearch,
    onTabChange,
    onSelect: selectConversation,
    onClearSelection: () => selectConversation(null),
    view: {
      title: t('title'),
      tabs: inboxTabItems(counts, t),
      activeTab,
      onTabChange,
      search,
      onSearchChange: setSearch,
      searchLabel: t('search.label'),
      searchPlaceholder: t('search.placeholder'),
      searchClearLabel: t('search.clear'),
      channelFilterLabel: t('filters.channel'),
      agentFilterLabel: t('filters.agent'),
      items: visible.map((conversation) =>
        inboxListItem(conversation, effectiveSelectedId, providerLabels, t),
      ),
      empty: inboxEmptyState(activeTab, t),
      loading,
      loadingLabel: t('loading'),
      loadError: failed
        ? {
            title: t('loadError'),
            retryLabel: t('retry'),
            onRetry: () => void retry(),
          }
        : null,
      onSelect: selectConversation,
    },
  };
}
