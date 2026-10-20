import { PROMPT_FOLDER_NAME_MAX_LENGTH } from '@agent-ic/contracts';
import { useStore } from '@tanstack/react-form';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useCreatePromptFolder } from '@/features/prompts/communication/hooks/useCreatePromptFolder';
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
  const { createPromptFolder } = useCreatePromptFolder();
  const { movePromptToFolder } = useMovePromptToFolder();
  const { fieldErrors, formError, reportFolder, reportMessage, clearField } = usePromptFormErrors();

  const resolveFolderId = useCallback(
    async (folderName: string): Promise<string | null> => {
      const trimmed = folderName.trim();
      const existing = findFolderByName(folders, trimmed);
      return existing === null ? createPromptFolder(trimmed) : existing.id;
    },
    [folders, createPromptFolder],
  );

  const form = useAppForm({
    defaultValues: { [PromptFormField.Folder]: findFolderName(folders, prompt.folderId) ?? '' },
    validators: {
      onSubmit: movePromptSchema(
        t('movePrompt.folderInvalid', { count: PROMPT_FOLDER_NAME_MAX_LENGTH }),
      ),
    },
    listeners: {
      onChange: ({ fieldApi }) => clearField(fieldApi.name),
    },
    onSubmit: async ({ value }) => {
      const folderName = value.folder.trim();
      let folderId: string | null;
      try {
        folderId = await resolveFolderId(folderName);
      } catch (failure) {
        reportFolder(failure);
        return;
      }
      if (folderId === null) {
        reportMessage(t('movePrompt.failed'));
        return;
      }
      try {
        const moved = await movePromptToFolder({ id: prompt.id, folderId });
        if (moved === null) {
          reportMessage(t('movePrompt.failed'));
          return;
        }
      } catch (failure) {
        reportMessage(errorMessage(toAppError(failure)));
        return;
      }
      showToast({
        message: t('movePrompt.success', { name: prompt.name, folder: folderName }),
        tone: ToastTone.Ok,
      });
      onClose();
    },
  });
  const submitting = useStore(form.store, (state) => state.isSubmitting);
  const selectedFolder = useStore(form.store, (state) => state.values[PromptFormField.Folder]);
  const resolved = findFolderByName(folders, selectedFolder.trim());
  const canSubmit = selectedFolder.trim() !== '' && resolved?.id !== prompt.folderId;

  return { form, fieldErrors, formError, submitting, canSubmit };
}
