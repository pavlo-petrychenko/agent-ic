import { useTranslation } from 'react-i18next';
import { KNOWLEDGE_NAMESPACE } from '@/features/knowledge/constants/knowledgeI18n.constants';
import type { RemoveSourceDocumentModalProps } from '@/features/knowledge/view/RemoveSourceDocumentModal/RemoveSourceDocumentModal.typedefs';
import { Button, ButtonVariant } from '@/shared/ui/actions/Button';
import { Dialog, DialogSize } from '@/shared/ui/overlays/Dialog';

export function RemoveSourceDocumentModal({
  documentName,
  sourceName,
  submitting,
  error,
  onSubmit,
  onClose,
}: RemoveSourceDocumentModalProps) {
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
      title={t('sources.removeDocument.title', { name: documentName })}
      description={t('sources.removeDocument.description', { source: sourceName })}
      closeLabel={t('dialog.close')}
      size={DialogSize.Sm}
      footerRight={
        <>
          <Button variant={ButtonVariant.Secondary} disabled={submitting} onClick={onClose}>
            {t('dialog.cancel')}
          </Button>
          <Button variant={ButtonVariant.Danger} loading={submitting} onClick={onSubmit}>
            {t('sources.removeDocument.submit')}
          </Button>
        </>
      }
    />
  );
}
