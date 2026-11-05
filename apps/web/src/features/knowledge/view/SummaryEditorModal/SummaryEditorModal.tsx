import { useTranslation } from 'react-i18next';
import { KNOWLEDGE_NAMESPACE } from '@/features/knowledge/constants/knowledgeI18n.constants';
import type { SummaryEditorModalProps } from '@/features/knowledge/view/SummaryEditorModal/SummaryEditorModal.typedefs';
import { Button, ButtonVariant } from '@/shared/ui/actions/Button';
import { Dialog, DialogSize } from '@/shared/ui/overlays/Dialog';

export function SummaryEditorModal({
  title,
  description,
  submitLabel,
  submitting,
  error,
  onSubmit,
  onClose,
  children,
}: SummaryEditorModalProps) {
  const { t } = useTranslation(KNOWLEDGE_NAMESPACE);

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
      title={title}
      description={description}
      closeLabel={t('dialog.close')}
      size={DialogSize.Sm}
      footerRight={
        <>
          <Button variant={ButtonVariant.Secondary} disabled={submitting} onClick={onClose}>
            {t('dialog.cancel')}
          </Button>
          <Button loading={submitting} onClick={onSubmit}>
            {submitLabel}
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
