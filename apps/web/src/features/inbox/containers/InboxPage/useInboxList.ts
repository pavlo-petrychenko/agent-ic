import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toInboxConversation } from '@/features/inbox/communication/helpers/inboxConversationApi.helpers';
import { useInboxConversations } from '@/features/inbox/communication/hooks/useInboxConversations';
import { InboxProvider, InboxTab } from '@/features/inbox/constants/inbox.constants';
import { INBOX_NAMESPACE } from '@/features/inbox/constants/inboxI18n.constants';
import type { InboxListResult } from '@/features/inbox/containers/InboxPage/InboxPage.typedefs';
import {
  countConversationsByTab,
  inboxTabOf,
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
  const { summaries, loading, failed, retry } = useInboxConversations();
  const [selectedTab, setSelectedTab] = useState<InboxTab | null>(null);
  const [search, setSearch] = useState('');
  const [channelIds, setChannelIds] = useState<string[]>([]);
  const [agentIds, setAgentIds] = useState<string[]>([]);
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

  const filtered = useMemo(
    () =>
      conversations.filter((conversation) =>
        matchesInboxFilters(conversation, { channelIds, agentIds }),
      ),
    [conversations, channelIds, agentIds],
  );
  const counts = useMemo(() => countConversationsByTab(filtered), [filtered]);
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

  const effectiveSelectedId =
    selectedId !== null && conversations.some((conversation) => conversation.id === selectedId)
      ? selectedId
      : (visible[0]?.id ?? null);
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
    onSearchChange: setSearch,
    onChannelIdsChange,
    onAgentIdsChange,
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
