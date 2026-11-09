import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toInboxConversation } from '@/features/inbox/communication/helpers/inboxConversationApi.helpers';
import { useInboxConversation } from '@/features/inbox/communication/hooks/useInboxConversation';
import { useInboxConversations } from '@/features/inbox/communication/hooks/useInboxConversations';
import { useInboxCounts } from '@/features/inbox/communication/hooks/useInboxCounts';
import { useInboxFilterOptions } from '@/features/inbox/communication/hooks/useInboxFilterOptions';
import {
  INBOX_QUEUE_BY_TAB,
  INBOX_TAB_BY_STATE,
  INBOX_SEARCH_DEBOUNCE_MS,
  InboxProvider,
  InboxTab,
} from '@/features/inbox/constants/inbox.constants';
import { INBOX_NAMESPACE } from '@/features/inbox/constants/inboxI18n.constants';
import type { InboxListResult } from '@/features/inbox/containers/InboxPage/InboxPage.typedefs';
import {
  inboxEmptyState,
  inboxFilterOptions,
  inboxListItem,
  inboxTabItems,
} from '@/features/inbox/logic/helpers/inboxList.helpers';
import { useDebouncedValue } from '@/features/inbox/logic/hooks/useDebouncedValue';
import type { InboxProviderLabels } from '@/features/inbox/typedefs/common.typedefs';
import type { InboxQueryFilters } from '@/features/inbox/typedefs/filters.typedefs';

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
  const [search, setSearch] = useState('');
  const [channelIds, setChannelIds] = useState<string[]>([]);
  const [agentIds, setAgentIds] = useState<string[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(initialConversationId);
  const debouncedSearch = useDebouncedValue(search, INBOX_SEARCH_DEBOUNCE_MS);
  const filters = useMemo<InboxQueryFilters>(
    () => ({
      queue: INBOX_QUEUE_BY_TAB[activeTab],
      channelIds,
      agentIds,
      search: debouncedSearch,
    }),
    [activeTab, channelIds, agentIds, debouncedSearch],
  );
  const { summaries, loading, failed, retry, loadMore, loadingMore, hasMore } =
    useInboxConversations(filters);
  const counts = useInboxCounts(filters);
  const filterOptions = useInboxFilterOptions();

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

  const channelOptions = useMemo(
    () => inboxFilterOptions(filterOptions.channels),
    [filterOptions.channels],
  );
  const agentOptions = useMemo(
    () => inboxFilterOptions(filterOptions.agents),
    [filterOptions.agents],
  );

  const effectiveSelectedId =
    selectedId !== null && conversations.some((conversation) => conversation.id === selectedId)
      ? selectedId
      : (conversations[0]?.id ?? null);
  const filtersApplied = search.trim() !== '' || channelIds.length > 0 || agentIds.length > 0;
  const selectConversation = (conversationId: string | null) => {
    setSelectedId(conversationId);
    onConversationChange?.(conversationId);
  };

  return {
    conversations,
    providerLabels,
    counts,
    visible: conversations,
    activeTab,
    search,
    channelIds,
    agentIds,
    effectiveSelectedId,
    hasMore,
    loadingMore,
    onSearchChange: setSearch,
    onChannelIdsChange: setChannelIds,
    onAgentIdsChange: setAgentIds,
    onTabChange: setSelectedTab,
    onSelect: selectConversation,
    onClearSelection: () => selectConversation(null),
    onLoadMore: () => void loadMore(),
    view: {
      title: t('title'),
      tabs: inboxTabItems(counts, t),
      activeTab,
      onTabChange: setSelectedTab,
      search,
      onSearchChange: setSearch,
      searchLabel: t('search.label'),
      searchPlaceholder: t('search.placeholder'),
      searchClearLabel: t('search.clear'),
      channelFilter: {
        label: t('filters.channel'),
        options: channelOptions,
        selectedIds: channelIds,
        onSelectedIdsChange: setChannelIds,
        clearLabel: t('filters.clearChannel'),
        ariaLabel: t('filters.channels'),
        search: null,
        disabled: loading,
      },
      agentFilter: {
        label: t('filters.agent'),
        options: agentOptions,
        selectedIds: agentIds,
        onSelectedIdsChange: setAgentIds,
        clearLabel: t('filters.clearAgent'),
        ariaLabel: t('filters.agents'),
        search: {
          label: t('filters.searchAgents'),
          clearLabel: t('filters.clearAgentSearch'),
          placeholder: t('filters.searchAgents'),
        },
        disabled: loading,
      },
      items: conversations.map((conversation) =>
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
