import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useRemoveSourceDocument } from '@/features/knowledge/communication/hooks/useRemoveSourceDocument';
import { KNOWLEDGE_NAMESPACE } from '@/features/knowledge/constants/knowledgeI18n.constants';
import type { RemoveSourceDocumentDialogProps } from '@/features/knowledge/containers/RemoveSourceDocumentDialog/RemoveSourceDocumentDialog.typedefs';
import { RemoveSourceDocumentModal } from '@/features/knowledge/view/RemoveSourceDocumentModal';
import { toAppError } from '@/shared/api/helpers/appError.helpers';
import { useErrorMessage } from '@/shared/i18n/hooks/useErrorMessage';
import { ToastTone, useToast } from '@/shared/ui/overlays/Toast';

export function RemoveSourceDocumentDialog({
  knowledgeBaseId,
  sourceId,
  sourceName,
  document,
  onRemoved,
  onClose,
}: RemoveSourceDocumentDialogProps) {
  const { t } = useTranslation(KNOWLEDGE_NAMESPACE);
  const { showToast } = useToast();
  const errorMessage = useErrorMessage();
  const { removeSourceDocument, removing } = useRemoveSourceDocument(knowledgeBaseId, sourceId);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async () => {
    try {
      await removeSourceDocument({ sourceId, documentId: document.id });
    } catch (failure) {
      setError(errorMessage(toAppError(failure)));
      return;
    }
    showToast({
      message: t('sources.removeDocument.success', { name: document.title }),
      tone: ToastTone.Ok,
    });
    onRemoved();
  };

  return (
    <RemoveSourceDocumentModal
      documentName={document.title}
      sourceName={sourceName}
      submitting={removing}
      error={error}
      onSubmit={() => void onSubmit()}
      onClose={onClose}
    />
  );
}
