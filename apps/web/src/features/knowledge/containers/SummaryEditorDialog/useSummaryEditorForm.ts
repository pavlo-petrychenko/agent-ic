import { KNOWLEDGE_SUMMARY_MAX_LENGTH } from '@agent-ic/contracts';
import { useStore } from '@tanstack/react-form';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useUpdateDocumentSummary } from '@/features/knowledge/communication/hooks/useUpdateDocumentSummary';
import { KnowledgeDocumentStatus } from '@/features/knowledge/constants/knowledgeDocument.constants';
import { KnowledgeFormField } from '@/features/knowledge/constants/knowledgeForm.constants';
import { KNOWLEDGE_NAMESPACE } from '@/features/knowledge/constants/knowledgeI18n.constants';
import { updateDocumentSummarySchema } from '@/features/knowledge/logic/schemas/knowledgeSummary.schema';
import type { KnowledgeSourceDocumentView } from '@/features/knowledge/typedefs/knowledgeSource.typedefs';
import { toAppError } from '@/shared/api/helpers/appError.helpers';
import { useAppForm } from '@/shared/forms/hooks/useAppForm';
import { useErrorMessage } from '@/shared/i18n/hooks/useErrorMessage';
import { ToastTone, useToast } from '@/shared/ui/overlays/Toast';

export function useSummaryEditorForm(
  sourceId: string,
  document: KnowledgeSourceDocumentView,
  onClose: () => void,
) {
  const { t } = useTranslation(KNOWLEDGE_NAMESPACE);
  const { showToast } = useToast();
  const { updateDocumentSummary } = useUpdateDocumentSummary(sourceId);
  const errorMessage = useErrorMessage();
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const clearErrors = useCallback(() => {
    setFieldError(null);
    setFormError(null);
  }, []);

  const invalidMessage = t('sources.summary.invalid', {
    count: KNOWLEDGE_SUMMARY_MAX_LENGTH,
  });
  const form = useAppForm({
    defaultValues: {
      [KnowledgeFormField.Summary]: document.summary ?? '',
    },
    validators: {
      onSubmit: updateDocumentSummarySchema(invalidMessage),
    },
    listeners: {
      onChange: clearErrors,
    },
    onSubmit: async ({ value }) => {
      clearErrors();
      const summary = value.summary.trim();
      try {
        const result = await updateDocumentSummary({ id: document.id, summary });
        const reindexing = result.document.status === KnowledgeDocumentStatus.Indexing;
        showToast({
          message: reindexing
            ? t('sources.summary.successReindexing', { name: document.title })
            : t('sources.summary.success', { name: document.title }),
          tone: ToastTone.Ok,
        });
        onClose();
      } catch (failure) {
        const error = toAppError(failure);
        if (error.fields.some((field) => field.path === KnowledgeFormField.Summary)) {
          setFieldError(invalidMessage);
          return;
        }
        setFormError(errorMessage(error));
      }
    },
  });
  const submitting = useStore(form.store, (state) => state.isSubmitting);

  return { form, fieldError, formError, submitting };
}
