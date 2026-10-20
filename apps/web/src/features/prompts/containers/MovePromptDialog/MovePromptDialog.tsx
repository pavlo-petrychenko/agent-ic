import { useTranslation } from 'react-i18next';
import { PromptFormField } from '@/features/prompts/constants/promptForm.constants';
import { PROMPTS_NAMESPACE } from '@/features/prompts/constants/promptsI18n.constants';
import type { MovePromptDialogProps } from '@/features/prompts/containers/MovePromptDialog/MovePromptDialog.typedefs';
import { useMovePromptForm } from '@/features/prompts/containers/MovePromptDialog/useMovePromptForm';
import { MovePromptModal } from '@/features/prompts/view/MovePromptModal';

export function MovePromptDialog({ prompt, folders, onClose }: MovePromptDialogProps) {
  const { t } = useTranslation(PROMPTS_NAMESPACE);
  const { form, fieldErrors, formError, submitting, canSubmit } = useMovePromptForm(
    prompt,
    folders,
    onClose,
  );

  return (
    <MovePromptModal
      submitting={submitting}
      submitDisabled={!canSubmit}
      error={formError}
      onSubmit={() => void form.handleSubmit()}
      onClose={onClose}
    >
      <form.AppField name={PromptFormField.Folder}>
        {(field) => (
          <field.ComboboxField
            label={t('movePrompt.folderLabel')}
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
    </MovePromptModal>
  );
}
