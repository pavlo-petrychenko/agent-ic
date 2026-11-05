import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCloseConversation } from '@/features/inbox/communication/hooks/useCloseConversation';
import { INBOX_NAMESPACE } from '@/features/inbox/constants/inboxI18n.constants';
import type { CloseChatDialogProps } from '@/features/inbox/containers/CloseChatDialog/CloseChatDialog.typedefs';
import { CloseChatModal } from '@/features/inbox/view/CloseChatModal';
import { toAppError } from '@/shared/api/helpers/appError.helpers';
import { useErrorMessage } from '@/shared/i18n/hooks/useErrorMessage';
import { ToastTone, useToast } from '@/shared/ui/overlays/Toast';

export function CloseChatDialog({
  conversationId,
  conversationName,
  onClose,
  onClosed,
}: CloseChatDialogProps) {
  const { t } = useTranslation(INBOX_NAMESPACE);
  const { closeConversation, closing } = useCloseConversation();
  const { showToast } = useToast();
  const errorMessage = useErrorMessage();
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);

  const changeMessage = (value: string) => {
    setMessage(value);
    setError(null);
  };

  const submit = async () => {
    const text = message.trim();
    try {
      await closeConversation(conversationId, text === '' ? null : text);
    } catch (caught) {
      setError(errorMessage(toAppError(caught)));
      return;
    }
    showToast({ message: t('closeChat.success'), tone: ToastTone.Ok });
    onClosed();
  };

  return (
    <CloseChatModal
      conversationName={conversationName}
      message={message}
      submitting={closing}
      error={error}
      onMessageChange={changeMessage}
      onSubmit={() => void submit()}
      onClose={onClose}
    />
  );
}
