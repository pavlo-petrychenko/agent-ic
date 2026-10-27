import { ErrorReason, KNOWLEDGE_BASE_NAME_MAX_LENGTH } from '@agent-ic/contracts';
import { useStore } from '@tanstack/react-form';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useRenameKnowledgeBase } from '@/features/knowledge/communication/hooks/useRenameKnowledgeBase';
import { KnowledgeFormField } from '@/features/knowledge/constants/knowledgeForm.constants';
import { KNOWLEDGE_NAMESPACE } from '@/features/knowledge/constants/knowledgeI18n.constants';
import { renameKnowledgeBaseSchema } from '@/features/knowledge/logic/schemas/knowledgeBase.schema';
import type { KnowledgeBase } from '@/features/knowledge/typedefs/knowledgeBase.typedefs';
import { toAppError } from '@/shared/api/helpers/appError.helpers';
import { useAppForm } from '@/shared/forms/hooks/useAppForm';
import { useErrorMessage } from '@/shared/i18n/hooks/useErrorMessage';
import { ToastTone, useToast } from '@/shared/ui/overlays/Toast';

export function useRenameKnowledgeBaseForm(knowledgeBase: KnowledgeBase, onClose: () => void) {
  const { t } = useTranslation(KNOWLEDGE_NAMESPACE);
  const { showToast } = useToast();
  const { renameKnowledgeBase } = useRenameKnowledgeBase();
  const errorMessage = useErrorMessage();
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const clearErrors = useCallback(() => {
    setFieldError(null);
    setFormError(null);
  }, []);

  const form = useAppForm({
    defaultValues: {
      [KnowledgeFormField.Name]: knowledgeBase.name,
    },
    validators: {
      onSubmit: renameKnowledgeBaseSchema(
        t('rename.nameInvalid', { count: KNOWLEDGE_BASE_NAME_MAX_LENGTH }),
      ),
    },
    listeners: {
      onChange: clearErrors,
    },
    onSubmit: async ({ value }) => {
      clearErrors();
      const name = value.name.trim();
      try {
        await renameKnowledgeBase({ id: knowledgeBase.id, name });
      } catch (failure) {
        const error = toAppError(failure);
        if (error.reason === ErrorReason.KnowledgeBaseNameTaken) {
          setFieldError(t('rename.nameTaken'));
          return;
        }
        if (error.fields.some((field) => field.path === KnowledgeFormField.Name)) {
          setFieldError(t('rename.nameInvalid', { count: KNOWLEDGE_BASE_NAME_MAX_LENGTH }));
          return;
        }
        setFormError(errorMessage(error));
        return;
      }
      showToast({ message: t('rename.success', { name }), tone: ToastTone.Ok });
      onClose();
    },
  });
  const submitting = useStore(form.store, (state) => state.isSubmitting);

  return { form, fieldError, formError, submitting };
}
