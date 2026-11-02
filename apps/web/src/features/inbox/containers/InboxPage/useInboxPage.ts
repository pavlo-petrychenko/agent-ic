import { useTranslation } from 'react-i18next';
import { INBOX_CURRENT_USER, InboxActionId } from '@/features/inbox/constants/inbox.constants';
import { INBOX_NAMESPACE } from '@/features/inbox/constants/inboxI18n.constants';
import type { InboxPageModel } from '@/features/inbox/containers/InboxPage/InboxPage.typedefs';
import { useInboxActions } from '@/features/inbox/containers/InboxPage/useInboxActions';
import { useInboxComposer } from '@/features/inbox/containers/InboxPage/useInboxComposer';
import { useInboxConversationView } from '@/features/inbox/containers/InboxPage/useInboxConversationView';
import { useInboxList } from '@/features/inbox/containers/InboxPage/useInboxList';
import { useInboxThread } from '@/features/inbox/containers/InboxPage/useInboxThread';
import type { InboxFooterContext } from '@/features/inbox/typedefs/inbox.typedefs';

export function useInboxPage(): InboxPageModel {
  const { t } = useTranslation(INBOX_NAMESPACE);
  const list = useInboxList();
  const thread = useInboxThread(list.conversations, list.effectiveSelectedId, list.providerLabels);
  const composer = useInboxComposer(thread.conversation?.id ?? null);
  const actions = useInboxActions({
    conversations: list.conversations,
    conversation: thread.conversation,
    onSelect: list.onSelect,
    onClosed: list.onClearSelection,
  });

  const footerContext: InboxFooterContext = {
    providerLabels: list.providerLabels,
    composer,
    currentUserName: INBOX_CURRENT_USER,
    onTakeOver: () => actions.onAction(InboxActionId.TakeOver),
  };
  const conversation = useInboxConversationView(
    thread.conversation,
    list.providerLabels,
    footerContext,
    actions.onAction,
  );

  return {
    list: list.view,
    conversation,
    details: thread.details,
    closeDialog: actions.closeDialog,
    emptyTitle: t('empty.detailTitle'),
    emptyDescription: t('empty.detailDescription'),
  };
}
