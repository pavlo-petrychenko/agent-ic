import { PROMPT_FOLDER_NAME_MAX_LENGTH, PROMPT_NAME_MAX_LENGTH } from '@agent-ic/contracts';
import { useStore } from '@tanstack/react-form';
import { useTranslation } from 'react-i18next';
import { PromptFormField } from '@/features/prompts/constants/promptForm.constants';
import { PROMPTS_NAMESPACE } from '@/features/prompts/constants/promptsI18n.constants';
import type { NewPromptDialogProps } from '@/features/prompts/containers/NewPromptDialog/NewPromptDialog.typedefs';
import { usePromptCreate } from '@/features/prompts/containers/NewPromptDialog/usePromptCreate';
import { createPromptSchema } from '@/features/prompts/logic/schemas/prompt.schema';
import { NewPromptModal } from '@/features/prompts/view/NewPromptModal';
import { useAppForm } from '@/shared/forms/hooks/useAppForm';
import { ToastTone, useToast } from '@/shared/ui/overlays/Toast';

export function NewPromptDialog({ folders, onClose }: NewPromptDialogProps) {
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
      if (!(await submit(value))) {
        return;
      }
      showToast({
        message: t('newPrompt.success', { name: value.name.trim() }),
        tone: ToastTone.Ok,
      });
      onClose();
    },
  });
  const submitting = useStore(form.store, (state) => state.isSubmitting);

  return (
    <NewPromptModal
      submitting={submitting}
      error={formError}
      onSubmit={() => void form.handleSubmit()}
      onClose={onClose}
    >
      <form.AppField name={PromptFormField.Name}>
        {(field) => (
          <field.TextField
            label={t('newPrompt.nameLabel')}
            autoComplete="off"
            type="text"
            error={fieldErrors[PromptFormField.Name] ?? null}
          />
        )}
      </form.AppField>
      <form.AppField name={PromptFormField.Folder}>
        {(field) => (
          <field.ComboboxField
            label={t('newPrompt.folderLabel')}
            hint={t('newPrompt.folderHint')}
            placeholder={t('newPrompt.folderPlaceholder')}
            searchLabel={t('newPrompt.folderSearch')}
            searchClearLabel={t('newPrompt.folderSearchClear')}
            emptyLabel={t('newPrompt.folderEmpty')}
            createLabel={(query) => t('newPrompt.folderCreate', { name: query })}
            options={folders.map((folder) => ({ value: folder.name, label: folder.name }))}
            error={fieldErrors[PromptFormField.Folder] ?? null}
          />
        )}
      </form.AppField>
    </NewPromptModal>
  );
}
