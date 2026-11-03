import { KNOWLEDGE_SUMMARY_MAX_LENGTH } from '@agent-ic/contracts';
import { useTranslation } from 'react-i18next';
import { KnowledgeFormField } from '@/features/knowledge/constants/knowledgeForm.constants';
import { KNOWLEDGE_NAMESPACE } from '@/features/knowledge/constants/knowledgeI18n.constants';
import { SUMMARY_EDITOR_ROWS } from '@/features/knowledge/containers/SummaryEditorDialog/SummaryEditorDialog.constants';
import type { SummaryEditorDialogProps } from '@/features/knowledge/containers/SummaryEditorDialog/SummaryEditorDialog.typedefs';
import { useSummaryEditorForm } from '@/features/knowledge/containers/SummaryEditorDialog/useSummaryEditorForm';
import { SummaryEditorModal } from '@/features/knowledge/view/SummaryEditorModal';

export function SummaryEditorDialog({ sourceId, document, onClose }: SummaryEditorDialogProps) {
  const { t } = useTranslation(KNOWLEDGE_NAMESPACE);
  const { form, fieldError, formError, submitting } = useSummaryEditorForm(
    sourceId,
    document,
    onClose,
  );
  const adding = (document.summary?.trim() ?? '').length === 0;

  return (
    <SummaryEditorModal
      title={t(adding ? 'sources.summary.editorTitleAdd' : 'sources.summary.editorTitle', {
        name: document.title,
      })}
      description={t('sources.summary.editorDescription')}
      submitLabel={t('sources.summary.submit')}
      submitting={submitting}
      error={formError}
      onSubmit={() => void form.handleSubmit()}
      onClose={onClose}
    >
      <form.AppField name={KnowledgeFormField.Summary}>
        {(field) => (
          <field.TextareaField
            label={t('sources.summary.label')}
            hint={t('sources.summary.hint', { count: KNOWLEDGE_SUMMARY_MAX_LENGTH })}
            error={fieldError}
            required
            rows={SUMMARY_EDITOR_ROWS}
            maxLength={KNOWLEDGE_SUMMARY_MAX_LENGTH}
          />
        )}
      </form.AppField>
    </SummaryEditorModal>
  );
}
