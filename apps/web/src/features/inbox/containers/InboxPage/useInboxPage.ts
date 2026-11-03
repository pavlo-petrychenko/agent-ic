import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  toInboxConversation,
  withInboxDetail,
} from '@/features/inbox/communication/helpers/inboxApi.helpers';
import { useHandBack } from '@/features/inbox/communication/hooks/useHandBack';
import { useInboxConversation } from '@/features/inbox/communication/hooks/useInboxConversation';
import { useInboxConversations } from '@/features/inbox/communication/hooks/useInboxConversations';
import { useReplyAsOperator } from '@/features/inbox/communication/hooks/useReplyAsOperator';
import { useTakeOver } from '@/features/inbox/communication/hooks/useTakeOver';
import {
  INBOX_CURRENT_USER,
  InboxActionId,
  InboxProvider,
  InboxTab,
} from '@/features/inbox/constants/inbox.constants';
import { INBOX_NAMESPACE } from '@/features/inbox/constants/inboxI18n.constants';
import type { InboxPageModel } from '@/features/inbox/containers/InboxPage/InboxPage.typedefs';
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
  InboxProviderLabels,
} from '@/features/inbox/typedefs/inbox.typedefs';
import { toAppError } from '@/shared/api/helpers/appError.helpers';
import { useErrorMessage } from '@/shared/i18n/hooks/useErrorMessage';
import { ToastTone, useToast } from '@/shared/ui/overlays/Toast';

export function useInboxPage(): InboxPageModel {
  const { t, i18n } = useTranslation(INBOX_NAMESPACE);
  const { summaries } = useInboxConversations();
  const { replyAsOperator, sending } = useReplyAsOperator();
  const { takeOver } = useTakeOver();
  const { handBack } = useHandBack();
  const { showToast } = useToast();
  const errorMessage = useErrorMessage();
  const [activeTab, setActiveTab] = useState<InboxTab>(InboxTab.NeedsYou);
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');

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

  const counts = useMemo(() => countConversationsByTab(conversations), [conversations]);
  const visible = useMemo(
    () => visibleConversations(conversations, activeTab, search, providerLabels),
    [conversations, activeTab, search, providerLabels],
  );

  const effectiveSelectedId =
    selectedId !== null && conversations.some((conversation) => conversation.id === selectedId)
      ? selectedId
      : (visible[0]?.id ?? null);
  const { detail } = useInboxConversation(effectiveSelectedId);

  const selectedBase =
    conversations.find((conversation) => conversation.id === effectiveSelectedId) ?? null;
  const selected =
    selectedBase === null || detail === null || detail.summary.id !== effectiveSelectedId
      ? selectedBase
      : withInboxDetail(selectedBase, detail, i18n.language, t('status.operator'));

  const changeTab = (tab: InboxTab) => {
    setActiveTab(tab);
    if (selectedBase === null || inboxTabOf(selectedBase) !== tab) {
      setSelectedId(firstConversationId(conversations, tab));
      setDraft('');
    }
  };

  const selectConversation = (id: string) => {
    setSelectedId(id);
    setDraft('');
  };

  const send = async () => {
    const text = draft.trim();
    if (text === '' || selected === null) {
      return;
    }
    try {
      await replyAsOperator(selected.id, text);
      setDraft('');
    } catch (caught) {
      showToast({ message: errorMessage(toAppError(caught)), tone: ToastTone.Err });
    }
  };

  const runAction = (id: InboxActionId) => {
    if (selected === null || id === InboxActionId.Close) {
      return;
    }
    setSelectedId(selected.id);
    const perform = id === InboxActionId.HandBack ? handBack : takeOver;
    void perform(selected.id).catch((caught: unknown) => {
      showToast({ message: errorMessage(toAppError(caught)), tone: ToastTone.Err });
    });
  };

  const composer: InboxComposerState = {
    value: draft,
    sending,
    onChange: setDraft,
    onSend: () => {
      void send();
    },
  };

  const footerContext: InboxFooterContext = {
    providerLabels,
    composer,
    currentUserName: INBOX_CURRENT_USER,
    onTakeOver: () => runAction(InboxActionId.TakeOver),
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
        inboxListItem(conversation, effectiveSelectedId, providerLabels, t),
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
            messages: inboxMessages(selected, t),
            footer: inboxFooter(selected, footerContext, t),
            onAction: runAction,
          },
    details: selected === null ? null : inboxDetails(selected, providerLabels, t),
    emptyTitle: t('empty.detailTitle'),
    emptyDescription: t('empty.detailDescription'),
  };
}
