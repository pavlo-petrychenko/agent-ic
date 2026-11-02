import { useTranslation } from 'react-i18next';
import { INBOX_CLOSING_MESSAGE_MAX_LENGTH } from '@/features/inbox/constants/inbox.constants';
import { INBOX_NAMESPACE } from '@/features/inbox/constants/inboxI18n.constants';
import { CLOSING_MESSAGE_ROWS } from '@/features/inbox/view/CloseChatModal/CloseChatModal.constants';
import type { CloseChatModalProps } from '@/features/inbox/view/CloseChatModal/CloseChatModal.typedefs';
import { Button, ButtonVariant } from '@/shared/ui/actions/Button';
import { Field } from '@/shared/ui/inputs/Field';
import { Textarea } from '@/shared/ui/inputs/Textarea';
import { Dialog, DialogSize } from '@/shared/ui/overlays/Dialog';

export function CloseChatModal({
  conversationName,
  message,
  submitting,
  error,
  onMessageChange,
  onSubmit,
  onClose,
}: CloseChatModalProps) {
  const { t } = useTranslation(INBOX_NAMESPACE);

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
      busy={submitting}
      error={error}
      title={t('closeChat.title', { name: conversationName })}
      description={t('closeChat.description')}
      closeLabel={t('closeChat.dismiss')}
      size={DialogSize.Sm}
      footerRight={
        <>
          <Button variant={ButtonVariant.Secondary} disabled={submitting} onClick={onClose}>
            {t('closeChat.cancel')}
          </Button>
          <Button variant={ButtonVariant.Danger} loading={submitting} onClick={onSubmit}>
            {t('closeChat.submit')}
          </Button>
        </>
      }
    >
      <Field
        label={t('closeChat.messageLabel')}
        hint={t('closeChat.messageHint', { max: INBOX_CLOSING_MESSAGE_MAX_LENGTH })}
      >
        {(control) => (
          <Textarea
            id={control.id}
            aria-describedby={control['aria-describedby']}
            rows={CLOSING_MESSAGE_ROWS}
            maxLength={INBOX_CLOSING_MESSAGE_MAX_LENGTH}
            value={message}
            onChange={(event) => onMessageChange(event.target.value)}
          />
        )}
      </Field>
    </Dialog>
  );
}
