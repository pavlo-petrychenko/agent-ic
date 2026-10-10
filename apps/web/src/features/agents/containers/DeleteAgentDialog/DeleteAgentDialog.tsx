import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDeleteAgent } from '@/features/agents/communication/hooks/useDeleteAgent';
import { AGENTS_NAMESPACE } from '@/features/agents/constants/agentsI18n.constants';
import type { DeleteAgentDialogProps } from '@/features/agents/containers/DeleteAgentDialog/DeleteAgentDialog.typedefs';
import { isDeleteConfirmed } from '@/features/agents/logic/helpers/agentDelete.helpers';
import { DeleteAgentModal } from '@/features/agents/view/DeleteAgentModal';
import { toAppError } from '@/shared/api/helpers/appError.helpers';
import { useErrorMessage } from '@/shared/i18n/hooks/useErrorMessage';
import { ToastTone, useToast } from '@/shared/ui/overlays/Toast';

export function DeleteAgentDialog({ agent, onClose }: DeleteAgentDialogProps) {
  const { t } = useTranslation(AGENTS_NAMESPACE);
  const { showToast } = useToast();
  const errorMessage = useErrorMessage();
  const { deleteAgent, deleting } = useDeleteAgent();
  const [typedName, setTypedName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async () => {
    try {
      await deleteAgent(agent.id);
      showToast({ message: t('delete.success', { name: agent.name }), tone: ToastTone.Ok });
      onClose();
    } catch (failure) {
      setError(errorMessage(toAppError(failure)));
    }
  };

  return (
    <DeleteAgentModal
      agentName={agent.name}
      versionCount={agent.versionCount}
      typedName={typedName}
      confirmed={isDeleteConfirmed(typedName, agent.name)}
      submitting={deleting}
      error={error}
      onTypedNameChange={setTypedName}
      onSubmit={() => void onSubmit()}
      onClose={onClose}
    />
  );
}
