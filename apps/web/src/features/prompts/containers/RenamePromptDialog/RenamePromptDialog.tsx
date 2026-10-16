import { useTranslation } from 'react-i18next';
import { PromptFormField } from '@/features/prompts/constants/promptForm.constants';
import { PROMPTS_NAMESPACE } from '@/features/prompts/constants/promptsI18n.constants';
import type { RenamePromptDialogProps } from '@/features/prompts/containers/RenamePromptDialog/RenamePromptDialog.typedefs';
import { useRenamePromptForm } from '@/features/prompts/containers/RenamePromptDialog/useRenamePromptForm';
import { RenamePromptModal } from '@/features/prompts/view/RenamePromptModal';

export function RenamePromptDialog({ prompt, onClose }: RenamePromptDialogProps) {
  const { t } = useTranslation(PROMPTS_NAMESPACE);
  const { form, fieldErrors, formError, submitting } = useRenamePromptForm(prompt, onClose);

  return (
    <RenamePromptModal
      submitting={submitting}
      error={formError}
      onSubmit={() => void form.handleSubmit()}
      onClose={onClose}
    >
      <form.AppField name={PromptFormField.Name}>
        {(field) => (
          <field.TextField
            label={t('renamePrompt.nameLabel')}
            autoComplete="off"
            type="text"
            error={fieldErrors[PromptFormField.Name] ?? null}
          />
        )}
      </form.AppField>
    </RenamePromptModal>
  );
}
