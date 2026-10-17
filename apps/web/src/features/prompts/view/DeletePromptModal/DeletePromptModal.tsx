import { useTranslation } from 'react-i18next';
import { PROMPTS_NAMESPACE } from '@/features/prompts/constants/promptsI18n.constants';
import type { DeletePromptModalProps } from '@/features/prompts/view/DeletePromptModal/DeletePromptModal.typedefs';
import { Button, ButtonVariant } from '@/shared/ui/actions/Button';
import { Dialog, DialogSize } from '@/shared/ui/overlays/Dialog';

export function DeletePromptModal({
  promptName,
  submitting,
  error,
  onSubmit,
  onClose,
}: DeletePromptModalProps) {
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
      title={t('deletePrompt.title', { name: promptName })}
      description={t('deletePrompt.description')}
      closeLabel={t('dialog.close')}
      size={DialogSize.Sm}
      footerRight={
        <>
          <Button variant={ButtonVariant.Secondary} disabled={submitting} onClick={onClose}>
            {t('dialog.cancel')}
          </Button>
          <Button variant={ButtonVariant.Danger} loading={submitting} onClick={onSubmit}>
            {t('deletePrompt.submit')}
          </Button>
        </>
      }
    />
  );
}
