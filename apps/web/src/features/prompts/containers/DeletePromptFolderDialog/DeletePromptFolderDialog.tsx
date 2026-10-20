import { ErrorCode } from '@agent-ic/contracts';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDeletePromptFolder } from '@/features/prompts/communication/hooks/useDeletePromptFolder';
import { PROMPTS_NAMESPACE } from '@/features/prompts/constants/promptsI18n.constants';
import type { DeletePromptFolderDialogProps } from '@/features/prompts/containers/DeletePromptFolderDialog/DeletePromptFolderDialog.typedefs';
import { DeletePromptFolderModal } from '@/features/prompts/view/DeletePromptFolderModal';
import { toAppError } from '@/shared/api/helpers/appError.helpers';
import { useErrorMessage } from '@/shared/i18n/hooks/useErrorMessage';
import { ToastTone, useToast } from '@/shared/ui/overlays/Toast';

export function DeletePromptFolderDialog({
  folder,
  promptCount,
  onClose,
}: DeletePromptFolderDialogProps) {
  const { t } = useTranslation(PROMPTS_NAMESPACE);
  const { showToast } = useToast();
  const errorMessage = useErrorMessage();
  const { deletePromptFolder, deleting } = useDeletePromptFolder();
  const [blocked, setBlocked] = useState(promptCount > 0);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async () => {
    try {
      await deletePromptFolder(folder.id);
      showToast({ message: t('deleteFolder.success', { name: folder.name }), tone: ToastTone.Ok });
      onClose();
    } catch (failure) {
      const appError = toAppError(failure);
      if (appError.code === ErrorCode.Conflict) {
        setBlocked(true);
        setError(null);
        return;
      }
      setError(errorMessage(appError));
    }
  };

  return (
    <DeletePromptFolderModal
      folderName={folder.name}
      blocked={blocked}
      submitting={deleting}
      error={error}
      onSubmit={() => void onSubmit()}
      onClose={onClose}
    />
  );
}
