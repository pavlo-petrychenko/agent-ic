import { PROMPT_FOLDER_NAME_MAX_LENGTH } from '@agent-ic/contracts';
import { useStore } from '@tanstack/react-form';
import { useTranslation } from 'react-i18next';
import { useRenamePromptFolder } from '@/features/prompts/communication/hooks/useRenamePromptFolder';
import { PromptFormField } from '@/features/prompts/constants/promptForm.constants';
import { PROMPTS_NAMESPACE } from '@/features/prompts/constants/promptsI18n.constants';
import { usePromptFormErrors } from '@/features/prompts/logic/hooks/usePromptFormErrors';
import { renamePromptFolderSchema } from '@/features/prompts/logic/schemas/prompt.schema';
import type { PromptFolderListItem } from '@/features/prompts/typedefs/promptFolder.typedefs';
import { useAppForm } from '@/shared/forms/hooks/useAppForm';
import { ToastTone, useToast } from '@/shared/ui/overlays/Toast';

export function useRenamePromptFolderForm(folder: PromptFolderListItem, onClose: () => void) {
  const { t } = useTranslation(PROMPTS_NAMESPACE);
  const { showToast } = useToast();
  const { renamePromptFolder } = useRenamePromptFolder();
  const { fieldErrors, formError, reportFolder, reportMessage, clearField } = usePromptFormErrors();

  const form = useAppForm({
    defaultValues: { [PromptFormField.Folder]: folder.name },
    validators: {
      onSubmit: renamePromptFolderSchema(
        t('renameFolder.nameInvalid', { count: PROMPT_FOLDER_NAME_MAX_LENGTH }),
      ),
    },
    listeners: {
      onChange: ({ fieldApi }) => clearField(fieldApi.name),
    },
    onSubmit: async ({ value }) => {
      const name = value.folder.trim();
      try {
        const renamed = await renamePromptFolder({ id: folder.id, name });
        if (renamed === null) {
          reportMessage(t('renameFolder.failed'));
          return;
        }
      } catch (failure) {
        reportFolder(failure);
        return;
      }
      showToast({ message: t('renameFolder.success', { name }), tone: ToastTone.Ok });
      onClose();
    },
  });
  const submitting = useStore(form.store, (state) => state.isSubmitting);

  return { form, fieldErrors, formError, submitting };
}
