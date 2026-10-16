import { useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDeletePrompt } from '@/features/prompts/communication/hooks/useDeletePrompt';
import { PROMPTS_NAMESPACE } from '@/features/prompts/constants/promptsI18n.constants';
import { PROMPTS_PATH } from '@/features/prompts/constants/route.constants';
import type { DeletePromptDialogProps } from '@/features/prompts/containers/DeletePromptDialog/DeletePromptDialog.typedefs';
import { usePromptDraftsStore } from '@/features/prompts/storage/hooks/usePromptDraftsStore';
import { DeletePromptModal } from '@/features/prompts/view/DeletePromptModal';
import { toAppError } from '@/shared/api/helpers/appError.helpers';
import { useErrorMessage } from '@/shared/i18n/hooks/useErrorMessage';
import { ToastTone, useToast } from '@/shared/ui/overlays/Toast';

export function DeletePromptDialog({ workspaceId, prompt, onClose }: DeletePromptDialogProps) {
  const { t } = useTranslation(PROMPTS_NAMESPACE);
  const navigate = useNavigate();
  const { showToast } = useToast();
  const errorMessage = useErrorMessage();
  const { deletePrompt, deleting } = useDeletePrompt();
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
