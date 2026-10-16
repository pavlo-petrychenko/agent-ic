import { PROMPT_NAME_MAX_LENGTH } from '@agent-ic/contracts';
import { useStore } from '@tanstack/react-form';
import { useTranslation } from 'react-i18next';
import { useRenamePrompt } from '@/features/prompts/communication/hooks/useRenamePrompt';
import { PromptFormField } from '@/features/prompts/constants/promptForm.constants';
import { PROMPTS_NAMESPACE } from '@/features/prompts/constants/promptsI18n.constants';
import { usePromptFormErrors } from '@/features/prompts/logic/hooks/usePromptFormErrors';
import { renamePromptSchema } from '@/features/prompts/logic/schemas/prompt.schema';
import type { PromptListItem } from '@/features/prompts/typedefs/prompt.typedefs';
import { useAppForm } from '@/shared/forms/hooks/useAppForm';
import { ToastTone, useToast } from '@/shared/ui/overlays/Toast';

export function useRenamePromptForm(prompt: PromptListItem, onClose: () => void) {
  const { t } = useTranslation(PROMPTS_NAMESPACE);
  const { showToast } = useToast();
  const { renamePrompt } = useRenamePrompt();
  const { fieldErrors, formError, reportName, reportMessage, clearField } = usePromptFormErrors();

  const form = useAppForm({
    defaultValues: { [PromptFormField.Name]: prompt.name },
    validators: {
      onSubmit: renamePromptSchema(
        t('renamePrompt.nameInvalid', { count: PROMPT_NAME_MAX_LENGTH }),
      ),
    },
    listeners: {
      onChange: ({ fieldApi }) => clearField(fieldApi.name),
    },
    onSubmit: async ({ value }) => {
      const name = value.name.trim();
      try {
        const renamed = await renamePrompt({ id: prompt.id, name });
        if (renamed === null) {
          reportMessage(t('renamePrompt.failed'));
          return;
        }
      } catch (failure) {
        reportName(failure);
        return;
      }
      showToast({ message: t('renamePrompt.success', { name }), tone: ToastTone.Ok });
      onClose();
    },
  });
  const submitting = useStore(form.store, (state) => state.isSubmitting);

  return { form, fieldErrors, formError, submitting };
}
