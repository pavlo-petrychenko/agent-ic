import { useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDeleteKnowledgeBase } from '@/features/knowledge/communication/hooks/useDeleteKnowledgeBase';
import { KNOWLEDGE_NAMESPACE } from '@/features/knowledge/constants/knowledgeI18n.constants';
import type { DeleteKnowledgeBaseDialogProps } from '@/features/knowledge/containers/DeleteKnowledgeBaseDialog/DeleteKnowledgeBaseDialog.typedefs';
import { DeleteKnowledgeBaseModal } from '@/features/knowledge/view/DeleteKnowledgeBaseModal';
import { toAppError } from '@/shared/api/helpers/appError.helpers';
import { useErrorMessage } from '@/shared/i18n/hooks/useErrorMessage';
import { ToastTone, useToast } from '@/shared/ui/overlays/Toast';

export function DeleteKnowledgeBaseDialog({
  workspaceId,
  knowledgeBase,
  onClose,
}: DeleteKnowledgeBaseDialogProps) {
  const { t } = useTranslation(KNOWLEDGE_NAMESPACE);
  const navigate = useNavigate();
  const { showToast } = useToast();
  const errorMessage = useErrorMessage();
  const { deleteKnowledgeBase, deleting } = useDeleteKnowledgeBase();
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async () => {
    try {
      await deleteKnowledgeBase(knowledgeBase.id);
    } catch (failure) {
      setError(errorMessage(toAppError(failure)));
      return;
    }
    showToast({
      message: t('delete.success', { name: knowledgeBase.name }),
      tone: ToastTone.Ok,
    });
    onClose();
    void navigate({
      to: '/w/$workspaceId/knowledge',
      params: { workspaceId },
      search: {},
      replace: true,
    });
  };

  return (
    <DeleteKnowledgeBaseModal
      knowledgeBaseName={knowledgeBase.name}
      submitting={deleting}
      error={error}
      onSubmit={() => void onSubmit()}
      onClose={onClose}
    />
  );
}
