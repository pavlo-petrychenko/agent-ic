import { useState } from 'react';
import { useReplyAsOperator } from '@/features/inbox/communication/hooks/useReplyAsOperator';
import type { InboxComposerState } from '@/features/inbox/typedefs/inbox.typedefs';
import { toAppError } from '@/shared/api/helpers/appError.helpers';
import { useErrorMessage } from '@/shared/i18n/hooks/useErrorMessage';
import { ToastTone, useToast } from '@/shared/ui/overlays/Toast';

interface InboxDraft {
  readonly conversationId: string | null;
  readonly text: string;
}

export function useInboxComposer(conversationId: string | null): InboxComposerState {
  const { replyAsOperator, sending } = useReplyAsOperator();
  const { showToast } = useToast();
  const errorMessage = useErrorMessage();
  const [draft, setDraft] = useState<InboxDraft>({ conversationId: null, text: '' });

  const value = draft.conversationId === conversationId ? draft.text : '';

  const change = (text: string) => {
    setDraft({ conversationId, text });
  };

  const reset = () => {
    setDraft({ conversationId, text: '' });
  };

  const send = async () => {
    const text = value.trim();
    if (text === '' || conversationId === null) {
      return;
    }
    try {
      await replyAsOperator(conversationId, text);
      reset();
    } catch (caught) {
      showToast({ message: errorMessage(toAppError(caught)), tone: ToastTone.Err });
    }
  };

  return {
    value,
    sending,
    onChange: change,
    onSend: () => {
      void send();
    },
  };
}
