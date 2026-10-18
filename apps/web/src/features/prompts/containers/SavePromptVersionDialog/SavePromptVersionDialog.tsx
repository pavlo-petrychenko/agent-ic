import { PROMPT_VERSION_NOTE_MAX_LENGTH } from '@agent-ic/contracts';
import { useStore } from '@tanstack/react-form';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSavePromptVersion } from '@/features/prompts/communication/hooks/useSavePromptVersion';
import { PromptFormField } from '@/features/prompts/constants/promptForm.constants';
import { PROMPTS_NAMESPACE } from '@/features/prompts/constants/promptsI18n.constants';
import type { SavePromptVersionDialogProps } from '@/features/prompts/containers/SavePromptVersionDialog/SavePromptVersionDialog.typedefs';
import { savePromptVersionSchema } from '@/features/prompts/logic/schemas/prompt.schema';
import { SavePromptVersionModal } from '@/features/prompts/view/SavePromptVersionModal';
import { toAppError } from '@/shared/api/helpers/appError.helpers';
import { useAppForm } from '@/shared/forms/hooks/useAppForm';
import { useErrorMessage } from '@/shared/i18n/hooks/useErrorMessage';
import { ToastTone, useToast } from '@/shared/ui/overlays/Toast';

export function SavePromptVersionDialog({
  promptId,
  promptName,
  text,
  versionNumber,
  onSaved,
  onClose,
}: SavePromptVersionDialogProps) {
  const { t } = useTranslation(PROMPTS_NAMESPACE);
  const { showToast } = useToast();
  const errorMessage = useErrorMessage();
  const { savePromptVersion } = useSavePromptVersion();
  const [error, setError] = useState<string | null>(null);

  const form = useAppForm({
    defaultValues: {
      [PromptFormField.Note]: '',
    },
    validators: {
      onSubmit: savePromptVersionSchema(
        t('saveVersion.noteInvalid', { count: PROMPT_VERSION_NOTE_MAX_LENGTH }),
      ),
    },
    onSubmit: async ({ value }) => {
      const note = value[PromptFormField.Note].trim();
      try {
        const number = await savePromptVersion({
          id: promptId,
          text,
          note: note === '' ? null : note,
        });
        if (number === null) {
          setError(t('saveVersion.failed'));
          return;
        }
        showToast({ message: t('draft.saved', { number }), tone: ToastTone.Ok });
        onSaved();
      } catch (failure) {
        setError(errorMessage(toAppError(failure)));
      }
    },
  });
  const submitting = useStore(form.store, (state) => state.isSubmitting);

  return (
    <SavePromptVersionModal
      promptName={promptName}
      versionNumber={versionNumber}
      submitting={submitting}
      error={error}
      onSubmit={() => void form.handleSubmit()}
      onClose={onClose}
    >
      <form.AppField name={PromptFormField.Note}>
        {(field) => (
          <field.TextField
            label={t('saveVersion.noteLabel')}
            hint={t('saveVersion.noteHint')}
            autoComplete="off"
            type="text"
          />
        )}
      </form.AppField>
    </SavePromptVersionModal>
  );
}
