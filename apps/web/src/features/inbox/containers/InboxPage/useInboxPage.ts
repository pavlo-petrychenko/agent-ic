import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useInboxCurrentUser } from '@/features/inbox/communication/hooks/useInboxCurrentUser';
import { useMarkNotificationsRead } from '@/features/inbox/communication/hooks/useMarkNotificationsRead';
import { InboxActionId } from '@/features/inbox/constants/inbox.constants';
import { INBOX_NAMESPACE } from '@/features/inbox/constants/inboxI18n.constants';
import type { InboxPageModel } from '@/features/inbox/containers/InboxPage/InboxPage.typedefs';
import { useInboxActions } from '@/features/inbox/containers/InboxPage/useInboxActions';
import { useInboxComposer } from '@/features/inbox/containers/InboxPage/useInboxComposer';
import { useInboxConversationView } from '@/features/inbox/containers/InboxPage/useInboxConversationView';
import { useInboxList } from '@/features/inbox/containers/InboxPage/useInboxList';
import { useInboxThread } from '@/features/inbox/containers/InboxPage/useInboxThread';
import type { InboxFooterContext } from '@/features/inbox/typedefs/conversationUi.typedefs';
import { toAppError } from '@/shared/api/helpers/appError.helpers';
import { useErrorMessage } from '@/shared/i18n/hooks/useErrorMessage';
import { ToastTone, useToast } from '@/shared/ui/overlays/Toast';

export function useInboxPage(
  initialConversationId: string | null,
  onConversationChange?: (conversationId: string | null) => void,
): InboxPageModel {
  const { t } = useTranslation(INBOX_NAMESPACE);
  const { showToast } = useToast();
  const errorMessage = useErrorMessage();
  const currentUser = useInboxCurrentUser();
  const currentUserName = currentUser?.name ?? '';
  const list = useInboxList(initialConversationId, onConversationChange);
  const thread = useInboxThread(
    list.conversations,
    list.effectiveSelectedId,
    list.providerLabels,
    currentUser,
  );
  const markNotificationsRead = useMarkNotificationsRead();
  const selectedConversationId = thread.conversation?.id ?? null;

  useEffect(() => {
    if (selectedConversationId === null) {
      return;
    }
    void markNotificationsRead(selectedConversationId).catch((error: unknown) => {
      showToast({ message: errorMessage(toAppError(error)), tone: ToastTone.Err });
    });
  }, [selectedConversationId, markNotificationsRead, showToast, errorMessage]);

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
    currentUserName,
    takeOverPending: actions.pendingAction !== null,
    onTakeOver: () => actions.onAction(InboxActionId.TakeOver),
  };
  const conversation = useInboxConversationView(
    thread.conversation,
    list.providerLabels,
    footerContext,
    thread.loading,
    thread.loadError,
    actions.pendingAction,
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
