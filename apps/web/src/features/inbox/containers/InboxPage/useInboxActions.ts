import { useState } from 'react';
import { useHandBack } from '@/features/inbox/communication/hooks/useHandBack';
import { useTakeOver } from '@/features/inbox/communication/hooks/useTakeOver';
import { InboxActionId, InboxReplyState } from '@/features/inbox/constants/inbox.constants';
import type {
  UseInboxActionsOptions,
  UseInboxActionsResult,
} from '@/features/inbox/containers/InboxPage/InboxPage.typedefs';
import { toAppError } from '@/shared/api/helpers/appError.helpers';
import { useErrorMessage } from '@/shared/i18n/hooks/useErrorMessage';
import { ToastTone, useToast } from '@/shared/ui/overlays/Toast';

export function useInboxActions({
  conversations,
  conversation,
  onSelect,
  onClosed,
}: UseInboxActionsOptions): UseInboxActionsResult {
  const { takeOver } = useTakeOver();
  const { handBack } = useHandBack();
  const { showToast } = useToast();
  const errorMessage = useErrorMessage();
  const [closingId, setClosingId] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<InboxActionId | null>(null);

  const onAction = (id: InboxActionId) => {
    if (conversation === null) {
      return;
    }
    if (id === InboxActionId.Close) {
      setClosingId(conversation.id);
      return;
    }
    onSelect(conversation.id);
    setPendingAction(id);
    void (async () => {
      try {
        if (id === InboxActionId.HandBack) {
          await handBack(conversation.id);
        } else {
          await takeOver(conversation.id, conversation.replyState === InboxReplyState.Operator);
        }
      } catch (caught) {
        showToast({ message: errorMessage(toAppError(caught)), tone: ToastTone.Err });
      } finally {
        setPendingAction(null);
      }
    })();
  };

  const closing = conversations.find((item) => item.id === closingId) ?? null;
  const closeDialog =
    closing === null
      ? null
      : {
          conversationId: closing.id,
          conversationName: closing.name,
          onClose: () => setClosingId(null),
          onClosed: () => {
            setClosingId(null);
            onClosed();
          },
        };

  return { onAction, closeDialog, pendingAction };
}
