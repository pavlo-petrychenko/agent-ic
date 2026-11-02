import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  INBOX_CONVERSATIONS,
  INBOX_CURRENT_USER,
  INBOX_DEFAULT_CONVERSATION_ID,
} from '@/features/inbox/communication/fixtures/inbox.fixture';
import {
  InboxMessageKind,
  InboxProvider,
  InboxTab,
} from '@/features/inbox/constants/inbox.constants';
import { INBOX_NAMESPACE } from '@/features/inbox/constants/inboxI18n.constants';
import {
  countConversationsByTab,
  firstConversationId,
  inboxTabOf,
  visibleConversations,
} from '@/features/inbox/logic/helpers/inbox.helpers';
import {
  inboxActions,
  inboxBanner,
  inboxFooter,
  inboxMessages,
} from '@/features/inbox/logic/helpers/inboxConversation.helpers';
import { inboxDetails } from '@/features/inbox/logic/helpers/inboxDetails.helpers';
import {
  inboxEmptyState,
  inboxListItem,
  inboxTabItems,
} from '@/features/inbox/logic/helpers/inboxList.helpers';
import type {
  InboxComposerState,
  InboxFooterContext,
  InboxMessage,
  InboxPageModel,
  InboxProviderLabels,
} from '@/features/inbox/typedefs/inbox.typedefs';

export function useInboxPage(): InboxPageModel {
  const { t } = useTranslation(INBOX_NAMESPACE);
  const [activeTab, setActiveTab] = useState<InboxTab>(InboxTab.NeedsYou);
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(INBOX_DEFAULT_CONVERSATION_ID);
  const [draft, setDraft] = useState('');
  const [sent, setSent] = useState<Readonly<Record<string, readonly InboxMessage[]>>>({});

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
      setDraft('');
    }
  };

  const selectConversation = (id: string) => {
    setSelectedId(id);
    setDraft('');
  };

  const send = () => {
    const text = draft.trim();
    if (text === '' || selected === null) {
      return;
    }
    const existing = sent[selected.id] ?? [];
    const message: InboxMessage = {
      kind: InboxMessageKind.Operator,
      id: `local-${existing.length + 1}`,
      author: t('authorYou', { name: INBOX_CURRENT_USER }),
      time: t('now'),
      text,
    };
    setSent((previous) => ({
      ...previous,
      [selected.id]: [...(previous[selected.id] ?? []), message],
    }));
    setDraft('');
  };

  const composer: InboxComposerState = {
    value: draft,
    onChange: setDraft,
    onSend: send,
  };

  const footerContext: InboxFooterContext = {
    providerLabels,
    composer,
    currentUserName: INBOX_CURRENT_USER,
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
    conversation:
      selected === null
        ? null
        : {
            name: selected.name,
            initials: selected.initials,
            subtitle: `${providerLabels[selected.provider]} · ${selected.agentName} v${selected.agentVersion}`,
            actions: inboxActions(selected, t),
            banner: inboxBanner(selected, t),
            messages: inboxMessages(selected, sent[selected.id] ?? [], t),
            footer: inboxFooter(selected, footerContext, t),
          },
    details: selected === null ? null : inboxDetails(selected, providerLabels, t),
    emptyTitle: t('empty.detailTitle'),
    emptyDescription: t('empty.detailDescription'),
  };
}
