import { useTranslation } from 'react-i18next';
import { PROMPTS_NAMESPACE } from '@/features/prompts/constants/promptsI18n.constants';
import type { DiscardPromptDraftModalProps } from '@/features/prompts/view/DiscardPromptDraftModal/DiscardPromptDraftModal.typedefs';
import { Button, ButtonVariant } from '@/shared/ui/actions/Button';
import { Dialog, DialogSize } from '@/shared/ui/overlays/Dialog';

export function DiscardPromptDraftModal({
  versionNumber,
  baseVersionNumber,
  onDiscard,
  onClose,
}: DiscardPromptDraftModalProps) {
  const { t } = useTranslation(PROMPTS_NAMESPACE);

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
      title={t('draft.discardTitle', { number: versionNumber })}
      description={
        baseVersionNumber === null
          ? t('draft.discardNewDescription')
          : t('draft.discardDescription', { base: baseVersionNumber })
      }
      closeLabel={t('dialog.close')}
      size={DialogSize.Sm}
      footerRight={
        <>
          <Button variant={ButtonVariant.Secondary} onClick={onClose}>
            {t('draft.keepEditing')}
          </Button>
          <Button variant={ButtonVariant.Danger} onClick={onDiscard}>
            {t('draft.discard')}
          </Button>
        </>
      }
    />
  );
}
