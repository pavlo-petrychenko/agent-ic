import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDeleteKnowledgeSource } from '@/features/knowledge/communication/hooks/useDeleteKnowledgeSource';
import { KNOWLEDGE_NAMESPACE } from '@/features/knowledge/constants/knowledgeI18n.constants';
import type { DeleteKnowledgeSourceDialogProps } from '@/features/knowledge/containers/DeleteKnowledgeSourceDialog/DeleteKnowledgeSourceDialog.typedefs';
import { DeleteKnowledgeSourceModal } from '@/features/knowledge/view/DeleteKnowledgeSourceModal';
import { toAppError } from '@/shared/api/helpers/appError.helpers';
import { useErrorMessage } from '@/shared/i18n/hooks/useErrorMessage';
import { ToastTone, useToast } from '@/shared/ui/overlays/Toast';

export function DeleteKnowledgeSourceDialog({
  knowledgeBaseId,
  source,
  onDeleted,
  onClose,
}: DeleteKnowledgeSourceDialogProps) {
  const { t } = useTranslation(KNOWLEDGE_NAMESPACE);
  const { showToast } = useToast();
  const errorMessage = useErrorMessage();
  const { deleteKnowledgeSource, deleting } = useDeleteKnowledgeSource(knowledgeBaseId);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async () => {
    try {
      await deleteKnowledgeSource(source.id);
    } catch (failure) {
      setError(errorMessage(toAppError(failure)));
      return;
    }
    showToast({
      message: t('sources.delete.success', { name: source.title }),
      tone: ToastTone.Ok,
    });
    onDeleted();
  };

  return (
    <DeleteKnowledgeSourceModal
      sourceName={source.title}
      submitting={deleting}
      error={error}
      onSubmit={() => void onSubmit()}
      onClose={onClose}
    />
  );
}
