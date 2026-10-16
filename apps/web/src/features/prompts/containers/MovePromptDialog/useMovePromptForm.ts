import { useStore } from '@tanstack/react-form';
import { useTranslation } from 'react-i18next';
import { useMovePromptToFolder } from '@/features/prompts/communication/hooks/useMovePromptToFolder';
import { PromptFormField } from '@/features/prompts/constants/promptForm.constants';
import { PROMPTS_NAMESPACE } from '@/features/prompts/constants/promptsI18n.constants';
import {
  findFolderByName,
  findFolderName,
} from '@/features/prompts/logic/helpers/promptFolder.helpers';
import { usePromptFormErrors } from '@/features/prompts/logic/hooks/usePromptFormErrors';
import { movePromptSchema } from '@/features/prompts/logic/schemas/prompt.schema';
import type { PromptListItem } from '@/features/prompts/typedefs/prompt.typedefs';
import type { PromptFolderListItem } from '@/features/prompts/typedefs/promptFolder.typedefs';
import { toAppError } from '@/shared/api/helpers/appError.helpers';
import { useAppForm } from '@/shared/forms/hooks/useAppForm';
import { useErrorMessage } from '@/shared/i18n/hooks/useErrorMessage';
import { ToastTone, useToast } from '@/shared/ui/overlays/Toast';

export function useMovePromptForm(
  prompt: PromptListItem,
  folders: readonly PromptFolderListItem[],
  onClose: () => void,
) {
  const { t } = useTranslation(PROMPTS_NAMESPACE);
  const { showToast } = useToast();
  const errorMessage = useErrorMessage();
  const { movePromptToFolder } = useMovePromptToFolder();
  const { fieldErrors, formError, reportMessage, clearField } = usePromptFormErrors();

  const form = useAppForm({
    defaultValues: { [PromptFormField.Folder]: findFolderName(folders, prompt.folderId) ?? '' },
    validators: {
      onSubmit: movePromptSchema(t('movePrompt.folderInvalid')),
    },
    listeners: {
      onChange: ({ fieldApi }) => clearField(fieldApi.name),
    },
    onSubmit: async ({ value }) => {
      const folder = findFolderByName(folders, value.folder);
      if (folder === null) {
        reportMessage(t('movePrompt.failed'));
        return;
      }
      try {
        const moved = await movePromptToFolder({ id: prompt.id, folderId: folder.id });
        if (moved === null) {
          reportMessage(t('movePrompt.failed'));
          return;
        }
      } catch (failure) {
        reportMessage(errorMessage(toAppError(failure)));
        return;
      }
      showToast({
        message: t('movePrompt.success', { name: prompt.name, folder: folder.name }),
        tone: ToastTone.Ok,
      });
      onClose();
    },
  });
  const submitting = useStore(form.store, (state) => state.isSubmitting);
  const selectedFolder = useStore(form.store, (state) => state.values[PromptFormField.Folder]);
  const canSubmit = findFolderByName(folders, selectedFolder)?.id !== prompt.folderId;

  return { form, fieldErrors, formError, submitting, canSubmit };
}
