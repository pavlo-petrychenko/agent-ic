import { useTranslation } from 'react-i18next';
import { PROMPTS_NAMESPACE } from '@/features/prompts/constants/promptsI18n.constants';
import type { DeletePromptFolderModalProps } from '@/features/prompts/view/DeletePromptFolderModal/DeletePromptFolderModal.typedefs';
import { Button, ButtonVariant } from '@/shared/ui/actions/Button';
import { Callout, CalloutTone } from '@/shared/ui/display/Callout';
import { IconName } from '@/shared/ui/foundations/Icon';
import { Dialog, DialogSize } from '@/shared/ui/overlays/Dialog';

export function DeletePromptFolderModal({
  folderName,
  blocked,
  submitting,
  error,
  onSubmit,
  onClose,
}: DeletePromptFolderModalProps) {
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
      title={t('deleteFolder.title', { name: folderName })}
      description={blocked ? null : t('deleteFolder.description')}
      closeLabel={t('dialog.close')}
      size={DialogSize.Sm}
      footerRight={
        blocked ? (
          <Button variant={ButtonVariant.Secondary} onClick={onClose}>
            {t('dialog.close')}
          </Button>
        ) : (
          <>
            <Button variant={ButtonVariant.Secondary} disabled={submitting} onClick={onClose}>
              {t('dialog.cancel')}
            </Button>
            <Button variant={ButtonVariant.Danger} loading={submitting} onClick={onSubmit}>
              {t('deleteFolder.submit')}
            </Button>
          </>
        )
      }
    >
      {blocked ? (
        <Callout tone={CalloutTone.Warn} icon={IconName.Alert}>
          {t('deleteFolder.notEmpty')}
        </Callout>
      ) : null}
    </Dialog>
  );
}
