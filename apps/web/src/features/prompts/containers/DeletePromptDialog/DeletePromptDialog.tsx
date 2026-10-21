import { useNavigate } from '@tanstack/react-router';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDeletePrompt } from '@/features/prompts/communication/hooks/useDeletePrompt';
import { usePromptVersions } from '@/features/prompts/communication/hooks/usePromptVersions';
import { PROMPTS_NAMESPACE } from '@/features/prompts/constants/promptsI18n.constants';
import { AGENT_BUILDER_PATH, PROMPTS_PATH } from '@/features/prompts/constants/route.constants';
import type { DeletePromptDialogProps } from '@/features/prompts/containers/DeletePromptDialog/DeletePromptDialog.typedefs';
import { usageCounts } from '@/features/prompts/logic/helpers/promptUsage.helpers';
import { usePromptDraftsStore } from '@/features/prompts/storage/hooks/usePromptDraftsStore';
import type { PromptUsageItem } from '@/features/prompts/typedefs/promptUsage.typedefs';
import { DeletePromptInUseModal } from '@/features/prompts/view/DeletePromptInUseModal';
import { DeletePromptModal } from '@/features/prompts/view/DeletePromptModal';
import { toAppError } from '@/shared/api/helpers/appError.helpers';
import { useErrorMessage } from '@/shared/i18n/hooks/useErrorMessage';
import { ToastTone, useToast } from '@/shared/ui/overlays/Toast';

export function DeletePromptDialog({
  workspaceId,
  prompt,
  usages,
  onClose,
}: DeletePromptDialogProps) {
  const { t } = useTranslation(PROMPTS_NAMESPACE);
  const navigate = useNavigate();
  const { showToast } = useToast();
  const errorMessage = useErrorMessage();
  const { deletePrompt, deleting } = useDeletePrompt();
  const { versions } = usePromptVersions(prompt.id);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async () => {
    try {
      await deletePrompt(prompt.id);
    } catch (failure) {
      setError(errorMessage(toAppError(failure)));
      return;
    }
    usePromptDraftsStore.getState().discard(prompt.id);
    showToast({ message: t('deletePrompt.success', { name: prompt.name }), tone: ToastTone.Ok });
    onClose();
    await navigate({ to: PROMPTS_PATH, params: { workspaceId } });
  };

  const openStep = useCallback(
    (usage: PromptUsageItem) => {
      void navigate({
        to: AGENT_BUILDER_PATH,
        params: { workspaceId, agentId: usage.agentId },
        search: { node: usage.nodeId },
      });
    },
    [navigate, workspaceId],
  );

  if (usages.length > 0) {
    return (
      <DeletePromptInUseModal
        promptName={prompt.name}
        stepsCount={usageCounts(usages).steps}
        versionCount={versions === null ? null : versions.length}
        usages={usages}
        onOpenStep={openStep}
        onClose={onClose}
      />
    );
  }

  return (
    <DeletePromptModal
      promptName={prompt.name}
      submitting={deleting}
      error={error}
      onSubmit={() => void onSubmit()}
      onClose={onClose}
    />
  );
}
