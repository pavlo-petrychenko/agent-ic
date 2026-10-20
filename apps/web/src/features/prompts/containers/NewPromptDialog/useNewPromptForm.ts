import { PROMPT_FOLDER_NAME_MAX_LENGTH, PROMPT_NAME_MAX_LENGTH } from '@agent-ic/contracts';
import { useStore } from '@tanstack/react-form';
import { useTranslation } from 'react-i18next';
import { PromptFormField } from '@/features/prompts/constants/promptForm.constants';
import { PROMPTS_NAMESPACE } from '@/features/prompts/constants/promptsI18n.constants';
import { usePromptCreate } from '@/features/prompts/containers/NewPromptDialog/usePromptCreate';
import { createPromptSchema } from '@/features/prompts/logic/schemas/prompt.schema';
import type { PromptFolderListItem } from '@/features/prompts/typedefs/promptFolder.typedefs';
import { useAppForm } from '@/shared/forms/hooks/useAppForm';
import { ToastTone, useToast } from '@/shared/ui/overlays/Toast';

export function useNewPromptForm(
  folders: readonly PromptFolderListItem[],
  onClose: () => void,
  onCreated: (promptId: string) => void,
) {
  const { t } = useTranslation(PROMPTS_NAMESPACE);
  const { showToast } = useToast();
  const { fieldErrors, formError, submit, clearField } = usePromptCreate(folders);

  const form = useAppForm({
    defaultValues: {
      [PromptFormField.Name]: '',
      [PromptFormField.Folder]: folders[0]?.name ?? '',
    },
    validators: {
      onSubmit: createPromptSchema({
        name: t('newPrompt.nameInvalid', { count: PROMPT_NAME_MAX_LENGTH }),
        folder: t('newPrompt.folderInvalid', { count: PROMPT_FOLDER_NAME_MAX_LENGTH }),
      }),
    },
    listeners: {
      onChange: ({ fieldApi }) => clearField(fieldApi.name),
    },
    onSubmit: async ({ value }) => {
      const promptId = await submit(value);
      if (promptId === null) {
        return;
      }
      showToast({
        message: t('newPrompt.success', { name: value.name.trim() }),
        tone: ToastTone.Ok,
      });
      onClose();
      onCreated(promptId);
    },
  });
  const submitting = useStore(form.store, (state) => state.isSubmitting);

  return { form, fieldErrors, formError, submitting };
}
