import { useTranslation } from 'react-i18next';
import { KnowledgeFormField } from '@/features/knowledge/constants/knowledgeForm.constants';
import { KNOWLEDGE_NAMESPACE } from '@/features/knowledge/constants/knowledgeI18n.constants';
import type { RenameKnowledgeBaseDialogProps } from '@/features/knowledge/containers/RenameKnowledgeBaseDialog/RenameKnowledgeBaseDialog.typedefs';
import { useRenameKnowledgeBaseForm } from '@/features/knowledge/containers/RenameKnowledgeBaseDialog/useRenameKnowledgeBaseForm';
import { RenameModal } from '@/features/knowledge/view/RenameModal';

export function RenameKnowledgeBaseDialog({
  knowledgeBase,
  onClose,
}: RenameKnowledgeBaseDialogProps) {
  const { t } = useTranslation(KNOWLEDGE_NAMESPACE);
  const { form, fieldError, formError, submitting } = useRenameKnowledgeBaseForm(
    knowledgeBase,
    onClose,
  );

  return (
    <RenameModal
      title={t('rename.title')}
      description={t('rename.description')}
      submitLabel={t('rename.submit')}
      submitting={submitting}
      error={formError}
      onSubmit={() => void form.handleSubmit()}
      onClose={onClose}
    >
      <form.AppField name={KnowledgeFormField.Name}>
        {(field) => (
          <field.TextField
            label={t('rename.nameLabel')}
            autoComplete="off"
            type="text"
            error={fieldError}
          />
        )}
      </form.AppField>
    </RenameModal>
  );
}
