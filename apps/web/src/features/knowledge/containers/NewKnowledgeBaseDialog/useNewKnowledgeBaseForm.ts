import { ErrorReason, KNOWLEDGE_BASE_NAME_MAX_LENGTH } from '@agent-ic/contracts';
import { useStore } from '@tanstack/react-form';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCreateKnowledgeBase } from '@/features/knowledge/communication/hooks/useCreateKnowledgeBase';
import { KnowledgeFormField } from '@/features/knowledge/constants/knowledgeForm.constants';
import { KNOWLEDGE_NAMESPACE } from '@/features/knowledge/constants/knowledgeI18n.constants';
import { createKnowledgeBaseSchema } from '@/features/knowledge/logic/schemas/knowledgeBase.schema';
import { toAppError } from '@/shared/api/helpers/appError.helpers';
import { useAppForm } from '@/shared/forms/hooks/useAppForm';
import { useErrorMessage } from '@/shared/i18n/hooks/useErrorMessage';
import { ToastTone, useToast } from '@/shared/ui/overlays/Toast';

export function useNewKnowledgeBaseForm(
  onClose: () => void,
  onCreated: (knowledgeBaseId: string) => void,
) {
  const { t } = useTranslation(KNOWLEDGE_NAMESPACE);
  const { showToast } = useToast();
  const { createKnowledgeBase } = useCreateKnowledgeBase();
  const errorMessage = useErrorMessage();
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const clearErrors = useCallback(() => {
    setFieldError(null);
    setFormError(null);
  }, []);

  const form = useAppForm({
    defaultValues: {
      [KnowledgeFormField.Name]: '',
    },
    validators: {
      onSubmit: createKnowledgeBaseSchema(
        t('new.nameInvalid', { count: KNOWLEDGE_BASE_NAME_MAX_LENGTH }),
      ),
    },
    listeners: {
      onChange: clearErrors,
    },
    onSubmit: async ({ value }) => {
      clearErrors();
      try {
        const created = await createKnowledgeBase({ name: value.name.trim() });
        showToast({
          message: t('new.success', { name: created.name }),
          tone: ToastTone.Ok,
        });
        onClose();
        onCreated(created.id);
      } catch (failure) {
        const error = toAppError(failure);
        if (error.reason === ErrorReason.KnowledgeBaseNameTaken) {
          setFieldError(t('new.nameTaken'));
          return;
        }
        if (error.fields.some((field) => field.path === KnowledgeFormField.Name)) {
          setFieldError(t('new.nameInvalid', { count: KNOWLEDGE_BASE_NAME_MAX_LENGTH }));
          return;
        }
        setFormError(errorMessage(error));
      }
    },
  });
  const submitting = useStore(form.store, (state) => state.isSubmitting);

  return { form, fieldError, formError, submitting };
}
