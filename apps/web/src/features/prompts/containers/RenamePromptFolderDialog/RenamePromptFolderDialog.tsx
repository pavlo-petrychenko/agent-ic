import { useTranslation } from 'react-i18next';
import { PromptFormField } from '@/features/prompts/constants/promptForm.constants';
import { PROMPTS_NAMESPACE } from '@/features/prompts/constants/promptsI18n.constants';
import type { RenamePromptFolderDialogProps } from '@/features/prompts/containers/RenamePromptFolderDialog/RenamePromptFolderDialog.typedefs';
import { useRenamePromptFolderForm } from '@/features/prompts/containers/RenamePromptFolderDialog/useRenamePromptFolderForm';
import { RenamePromptFolderModal } from '@/features/prompts/view/RenamePromptFolderModal';

export function RenamePromptFolderDialog({ folder, onClose }: RenamePromptFolderDialogProps) {
  const { t } = useTranslation(PROMPTS_NAMESPACE);
  const { form, fieldErrors, formError, submitting } = useRenamePromptFolderForm(folder, onClose);

  return (
    <RenamePromptFolderModal
      submitting={submitting}
      error={formError}
      onSubmit={() => void form.handleSubmit()}
      onClose={onClose}
    >
      <form.AppField name={PromptFormField.Folder}>
        {(field) => (
          <field.TextField
            label={t('renameFolder.nameLabel')}
            autoComplete="off"
            type="text"
            error={fieldErrors[PromptFormField.Folder] ?? null}
          />
        )}
      </form.AppField>
    </RenamePromptFolderModal>
  );
}
