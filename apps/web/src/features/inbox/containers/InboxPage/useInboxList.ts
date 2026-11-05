import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toInboxConversation } from '@/features/inbox/communication/helpers/inboxConversationApi.helpers';
import { useInboxConversation } from '@/features/inbox/communication/hooks/useInboxConversation';
import { useInboxConversations } from '@/features/inbox/communication/hooks/useInboxConversations';
import { useInboxCounts } from '@/features/inbox/communication/hooks/useInboxCounts';
import {
  INBOX_QUEUE_BY_TAB,
  INBOX_TAB_BY_STATE,
  InboxProvider,
  InboxTab,
} from '@/features/inbox/constants/inbox.constants';
import { INBOX_NAMESPACE } from '@/features/inbox/constants/inboxI18n.constants';
import type { InboxListResult } from '@/features/inbox/containers/InboxPage/InboxPage.typedefs';
import {
  matchesInboxFilters,
  visibleConversations,
} from '@/features/inbox/logic/helpers/inbox.helpers';
import {
  inboxAgentOptions,
  inboxChannelOptions,
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
  const initialConversation = useInboxConversation(initialConversationId);
  const [selectedTab, setSelectedTab] = useState<InboxTab | null>(null);
  const initialTab =
    initialConversation.detail === null
      ? null
      : INBOX_TAB_BY_STATE[initialConversation.detail.summary.state];
  const activeTab = selectedTab ?? initialTab ?? InboxTab.NeedsYou;
  const { summaries, loading, failed, retry, loadMore, loadingMore, hasMore } =
    useInboxConversations(INBOX_QUEUE_BY_TAB[activeTab]);
  const counts = useInboxCounts();
  const [search, setSearch] = useState('');
  const [channelIds, setChannelIds] = useState<string[]>([]);
  const [agentIds, setAgentIds] = useState<string[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(initialConversationId);

  const conversations = useMemo(
    () =>
      summaries.map((summary) => toInboxConversation(summary, i18n.language, t('status.operator'))),
    [summaries, i18n.language, t],
  );

  const providerLabels = useMemo<InboxProviderLabels>(
    () => ({
      [InboxProvider.Telegram]: t('provider.telegram'),
      [InboxProvider.Api]: t('provider.api'),
    }),
    [t],
  );

  const filtered = useMemo(
    () =>
      conversations.filter((conversation) =>
        matchesInboxFilters(conversation, { channelIds, agentIds }),
      ),
    [conversations, channelIds, agentIds],
  );
  const visible = useMemo(
    () => visibleConversations(filtered, activeTab, search, providerLabels),
    [filtered, activeTab, search, providerLabels],
  );

  const channelOptions = useMemo(
    () => inboxChannelOptions(conversations, providerLabels),
    [conversations, providerLabels],
  );
  const agentOptions = useMemo(() => inboxAgentOptions(conversations), [conversations]);

  const selectFirstMatching = (
    nextChannelIds: readonly string[],
    nextAgentIds: readonly string[],
    tab: InboxTab,
    query: string,
  ) => {
    const nextFiltered = conversations.filter((conversation) =>
      matchesInboxFilters(conversation, { channelIds: nextChannelIds, agentIds: nextAgentIds }),
    );
    const nextVisible = visibleConversations(nextFiltered, tab, query, providerLabels);
    setSelectedId((current) =>
      current !== null && nextVisible.some((conversation) => conversation.id === current)
        ? current
        : (nextVisible[0]?.id ?? null),
    );
  };

  const effectiveSelectedId = selectedId ?? visible[0]?.id ?? null;
  const filtersApplied = search.trim() !== '' || channelIds.length > 0 || agentIds.length > 0;
  const selectConversation = (conversationId: string | null) => {
    setSelectedId(conversationId);
    onConversationChange?.(conversationId);
  };

  const onTabChange = (tab: InboxTab) => {
    setSelectedTab(tab);
    selectFirstMatching(channelIds, agentIds, tab, search);
  };
  const onChannelIdsChange = (ids: string[]) => {
    setChannelIds(ids);
    selectFirstMatching(ids, agentIds, activeTab, search);
  };
  const onAgentIdsChange = (ids: string[]) => {
    setAgentIds(ids);
    selectFirstMatching(channelIds, ids, activeTab, search);
  };

  return {
    conversations,
    providerLabels,
    counts,
    visible,
    activeTab,
    search,
    channelIds,
    agentIds,
    effectiveSelectedId,
    hasMore,
    loadingMore,
    onSearchChange: setSearch,
    onChannelIdsChange,
    onAgentIdsChange,
    onTabChange,
    onSelect: selectConversation,
    onClearSelection: () => selectConversation(null),
    onLoadMore: () => void loadMore(),
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
      channelFilter: {
        label: t('filters.channel'),
        options: channelOptions,
        selectedIds: channelIds,
        onSelectedIdsChange: onChannelIdsChange,
        clearLabel: t('filters.clearChannel'),
        ariaLabel: t('filters.channels'),
        search: null,
        disabled: loading,
      },
      agentFilter: {
        label: t('filters.agent'),
        options: agentOptions,
        selectedIds: agentIds,
        onSelectedIdsChange: onAgentIdsChange,
        clearLabel: t('filters.clearAgent'),
        ariaLabel: t('filters.agents'),
        search: {
          label: t('filters.searchAgents'),
          clearLabel: t('filters.clearAgentSearch'),
          placeholder: t('filters.searchAgents'),
        },
        disabled: loading,
      },
      items: visible.map((conversation) =>
        inboxListItem(conversation, effectiveSelectedId, providerLabels, t),
      ),
      empty: inboxEmptyState(activeTab, t, filtersApplied),
      loading,
      loadingLabel: t('loading'),
      hasMore,
      loadingMore,
      loadMoreLabel: t('loadMore'),
      loadingMoreLabel: t('loadingMore'),
      onLoadMore: () => void loadMore(),
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
