import { KNOWLEDGE_SOURCE_TITLE_MAX_LENGTH } from '@agent-ic/contracts';
import { useStore } from '@tanstack/react-form';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useRenameKnowledgeSource } from '@/features/knowledge/communication/hooks/useRenameKnowledgeSource';
import { KnowledgeFormField } from '@/features/knowledge/constants/knowledgeForm.constants';
import { KNOWLEDGE_NAMESPACE } from '@/features/knowledge/constants/knowledgeI18n.constants';
import { renameKnowledgeSourceSchema } from '@/features/knowledge/logic/schemas/knowledgeSource.schema';
import type { KnowledgeSourceRowView } from '@/features/knowledge/typedefs/knowledgeSource.typedefs';
import { toAppError } from '@/shared/api/helpers/appError.helpers';
import { useAppForm } from '@/shared/forms/hooks/useAppForm';
import { useErrorMessage } from '@/shared/i18n/hooks/useErrorMessage';
import { ToastTone, useToast } from '@/shared/ui/overlays/Toast';

export function useRenameKnowledgeSourceForm(
  knowledgeBaseId: string,
  source: KnowledgeSourceRowView,
  onClose: () => void,
) {
  const { t } = useTranslation(KNOWLEDGE_NAMESPACE);
  const { showToast } = useToast();
  const { renameKnowledgeSource } = useRenameKnowledgeSource(knowledgeBaseId);
  const errorMessage = useErrorMessage();
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const clearErrors = useCallback(() => {
    setFieldError(null);
    setFormError(null);
  }, []);

  const form = useAppForm({
    defaultValues: {
      [KnowledgeFormField.Title]: source.title,
    },
    validators: {
      onSubmit: renameKnowledgeSourceSchema(
        t('sources.rename.nameInvalid', { count: KNOWLEDGE_SOURCE_TITLE_MAX_LENGTH }),
      ),
    },
    listeners: {
      onChange: clearErrors,
    },
    onSubmit: async ({ value }) => {
      clearErrors();
      const title = value.title.trim();
      try {
        await renameKnowledgeSource({ id: source.id, title });
      } catch (failure) {
        const error = toAppError(failure);
        if (error.fields.some((field) => field.path === KnowledgeFormField.Title)) {
          setFieldError(
            t('sources.rename.nameInvalid', { count: KNOWLEDGE_SOURCE_TITLE_MAX_LENGTH }),
          );
          return;
        }
        setFormError(errorMessage(error));
        return;
      }
      showToast({ message: t('sources.rename.success', { name: title }), tone: ToastTone.Ok });
      onClose();
    },
  });
  const submitting = useStore(form.store, (state) => state.isSubmitting);

  return { form, fieldError, formError, submitting };
}
