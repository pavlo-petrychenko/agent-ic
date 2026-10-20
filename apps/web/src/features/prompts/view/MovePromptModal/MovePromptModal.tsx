import { useTranslation } from 'react-i18next';
import { PROMPTS_NAMESPACE } from '@/features/prompts/constants/promptsI18n.constants';
import type { MovePromptModalProps } from '@/features/prompts/view/MovePromptModal/MovePromptModal.typedefs';
import { Button, ButtonVariant } from '@/shared/ui/actions/Button';
import { Dialog, DialogSize } from '@/shared/ui/overlays/Dialog';

export function MovePromptModal({
  submitting,
  submitDisabled,
  error,
  onSubmit,
  onClose,
  children,
}: MovePromptModalProps) {
  const { t } = useTranslation(PROMPTS_NAMESPACE);

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
      title={t('movePrompt.title')}
      closeLabel={t('dialog.close')}
      size={DialogSize.Sm}
      footerRight={
        <>
          <Button variant={ButtonVariant.Secondary} disabled={submitting} onClick={onClose}>
            {t('dialog.cancel')}
          </Button>
          <Button disabled={submitting || submitDisabled} loading={submitting} onClick={onSubmit}>
            {t('movePrompt.submit')}
          </Button>
        </>
      }
    >
      <form
        noValidate
        className="flex flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
      >
        {children}
      </form>
    </Dialog>
  );
}
