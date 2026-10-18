import { useNavigate } from '@tanstack/react-router';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { PromptFormField } from '@/features/prompts/constants/promptForm.constants';
import { PROMPTS_NAMESPACE } from '@/features/prompts/constants/promptsI18n.constants';
import type { NewPromptDialogProps } from '@/features/prompts/containers/NewPromptDialog/NewPromptDialog.typedefs';
import { useNewPromptForm } from '@/features/prompts/containers/NewPromptDialog/useNewPromptForm';
import { storeLastOpenedPromptId } from '@/features/prompts/storage/helpers/promptLastOpenedStorage.helpers';
import { NewPromptModal } from '@/features/prompts/view/NewPromptModal';

export function NewPromptDialog({ workspaceId, folders, onClose }: NewPromptDialogProps) {
  const { t } = useTranslation(PROMPTS_NAMESPACE);
  const navigate = useNavigate();
  const openCreated = useCallback(
    (promptId: string) => {
      storeLastOpenedPromptId(workspaceId, promptId);
      void navigate({
        to: '/w/$workspaceId/prompts/$promptId',
        params: { workspaceId, promptId },
        replace: true,
      });
    },
    [navigate, workspaceId],
  );
  const { form, fieldErrors, formError, submitting } = useNewPromptForm(
    folders,
    onClose,
    openCreated,
  );

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
