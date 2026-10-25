import { useTranslation } from 'react-i18next';
import { KnowledgeFormField } from '@/features/knowledge/constants/knowledgeForm.constants';
import { KNOWLEDGE_NAMESPACE } from '@/features/knowledge/constants/knowledgeI18n.constants';
import type { NewKnowledgeBaseDialogProps } from '@/features/knowledge/containers/NewKnowledgeBaseDialog/NewKnowledgeBaseDialog.typedefs';
import { useNewKnowledgeBaseForm } from '@/features/knowledge/containers/NewKnowledgeBaseDialog/useNewKnowledgeBaseForm';
import { NewKnowledgeBaseModal } from '@/features/knowledge/view/NewKnowledgeBaseModal';

export function NewKnowledgeBaseDialog({ onClose, onCreated }: NewKnowledgeBaseDialogProps) {
  const { t } = useTranslation(KNOWLEDGE_NAMESPACE);
  const { form, fieldError, formError, submitting } = useNewKnowledgeBaseForm(onClose, onCreated);

  return (
    <NewKnowledgeBaseModal
      submitting={submitting}
      error={formError}
      onSubmit={() => void form.handleSubmit()}
      onClose={onClose}
    >
      <form.AppField name={KnowledgeFormField.Name}>
        {(field) => (
          <field.TextField
            label={t('new.nameLabel')}
            placeholder={t('new.namePlaceholder')}
            autoComplete="off"
            type="text"
            error={fieldError}
          />
        )}
      </form.AppField>
    </NewKnowledgeBaseModal>
  );
}
