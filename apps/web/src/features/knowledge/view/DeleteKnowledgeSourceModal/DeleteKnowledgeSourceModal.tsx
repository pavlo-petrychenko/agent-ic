import { useTranslation } from 'react-i18next';
import { KNOWLEDGE_NAMESPACE } from '@/features/knowledge/constants/knowledgeI18n.constants';
import type { DeleteKnowledgeSourceModalProps } from '@/features/knowledge/view/DeleteKnowledgeSourceModal/DeleteKnowledgeSourceModal.typedefs';
import { Button, ButtonVariant } from '@/shared/ui/actions/Button';
import { Dialog, DialogSize } from '@/shared/ui/overlays/Dialog';

export function DeleteKnowledgeSourceModal({
  sourceName,
  submitting,
  error,
  onSubmit,
  onClose,
}: DeleteKnowledgeSourceModalProps) {
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
      title={t('sources.delete.title', { name: sourceName })}
      description={t('sources.delete.description')}
      closeLabel={t('dialog.close')}
      size={DialogSize.Sm}
      footerRight={
        <>
          <Button variant={ButtonVariant.Secondary} disabled={submitting} onClick={onClose}>
            {t('dialog.cancel')}
          </Button>
          <Button variant={ButtonVariant.Danger} loading={submitting} onClick={onSubmit}>
            {t('sources.delete.submit')}
          </Button>
        </>
      }
    />
  );
}
