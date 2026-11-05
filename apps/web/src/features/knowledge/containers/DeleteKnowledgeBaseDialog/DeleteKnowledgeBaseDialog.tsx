import { useNavigate } from '@tanstack/react-router';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDeleteKnowledgeBase } from '@/features/knowledge/communication/hooks/useDeleteKnowledgeBase';
import { useKnowledgeBaseUsages } from '@/features/knowledge/communication/hooks/useKnowledgeBaseUsages';
import { KNOWLEDGE_NAMESPACE } from '@/features/knowledge/constants/knowledgeI18n.constants';
import { AGENT_BUILDER_PATH } from '@/features/knowledge/constants/route.constants';
import type { DeleteKnowledgeBaseDialogProps } from '@/features/knowledge/containers/DeleteKnowledgeBaseDialog/DeleteKnowledgeBaseDialog.typedefs';
import { DeleteKnowledgeBaseInUseModal } from '@/features/knowledge/view/DeleteKnowledgeBaseInUseModal';
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
  const { usages } = useKnowledgeBaseUsages(knowledgeBase.id);
  const [error, setError] = useState<string | null>(null);

  const openStep = useCallback(
    (usage: (typeof usages)[number]) => {
      void navigate({
        to: AGENT_BUILDER_PATH,
        params: { workspaceId, agentId: usage.agentId },
        search: { node: usage.nodeId },
      });
    },
    [navigate, workspaceId],
  );

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

  if (usages.length > 0) {
    return (
      <DeleteKnowledgeBaseInUseModal
        knowledgeBaseName={knowledgeBase.name}
        usages={usages}
        onOpenStep={openStep}
        onClose={onClose}
      />
    );
  }

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
