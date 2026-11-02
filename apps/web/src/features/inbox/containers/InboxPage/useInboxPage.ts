import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  INBOX_CONVERSATIONS,
  INBOX_DEFAULT_CONVERSATION_ID,
} from '@/features/inbox/communication/fixtures/inbox.fixture';
import { InboxProvider, InboxTab } from '@/features/inbox/constants/inbox.constants';
import { INBOX_NAMESPACE } from '@/features/inbox/constants/inboxI18n.constants';
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
import type { InboxPageModel, InboxProviderLabels } from '@/features/inbox/typedefs/inbox.typedefs';

export function useInboxPage(): InboxPageModel {
  const { t } = useTranslation(INBOX_NAMESPACE);
  const [activeTab, setActiveTab] = useState<InboxTab>(InboxTab.NeedsYou);
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(INBOX_DEFAULT_CONVERSATION_ID);

  const providerLabels = useMemo<InboxProviderLabels>(
    () => ({
      [InboxProvider.Telegram]: t('provider.telegram'),
      [InboxProvider.Api]: t('provider.api'),
    }),
    [t],
  );

  const counts = useMemo(() => countConversationsByTab(INBOX_CONVERSATIONS), []);
  const visible = useMemo(
    () => visibleConversations(INBOX_CONVERSATIONS, activeTab, search, providerLabels),
    [activeTab, search, providerLabels],
  );
  const selected =
    INBOX_CONVERSATIONS.find((conversation) => conversation.id === selectedId) ?? null;

  const changeTab = (tab: InboxTab) => {
    setActiveTab(tab);
    if (selected === null || inboxTabOf(selected) !== tab) {
      setSelectedId(firstConversationId(INBOX_CONVERSATIONS, tab));
    }
  };

  const selectConversation = (id: string) => {
    setSelectedId(id);
  };

  return {
    list: {
      title: t('title'),
      tabs: inboxTabItems(counts, t),
      activeTab,
      onTabChange: changeTab,
      search,
      onSearchChange: setSearch,
      searchLabel: t('search.label'),
      searchPlaceholder: t('search.placeholder'),
      searchClearLabel: t('search.clear'),
      channelFilterLabel: t('filters.channel'),
      agentFilterLabel: t('filters.agent'),
      items: visible.map((conversation) =>
        inboxListItem(conversation, selectedId, providerLabels, t),
      ),
      empty: inboxEmptyState(activeTab, t),
      onSelect: selectConversation,
    },
    conversation: null,
    details: null,
    emptyTitle: t('empty.detailTitle'),
    emptyDescription: t('empty.detailDescription'),
  };
}
