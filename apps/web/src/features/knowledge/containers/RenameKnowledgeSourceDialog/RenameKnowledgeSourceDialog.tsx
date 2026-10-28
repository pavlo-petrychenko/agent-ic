import { useTranslation } from 'react-i18next';
import { KnowledgeFormField } from '@/features/knowledge/constants/knowledgeForm.constants';
import { KNOWLEDGE_NAMESPACE } from '@/features/knowledge/constants/knowledgeI18n.constants';
import type { RenameKnowledgeSourceDialogProps } from '@/features/knowledge/containers/RenameKnowledgeSourceDialog/RenameKnowledgeSourceDialog.typedefs';
import { useRenameKnowledgeSourceForm } from '@/features/knowledge/containers/RenameKnowledgeSourceDialog/useRenameKnowledgeSourceForm';
import { RenameModal } from '@/features/knowledge/view/RenameModal';

export function RenameKnowledgeSourceDialog({
  knowledgeBaseId,
  source,
  onClose,
}: RenameKnowledgeSourceDialogProps) {
  const { t } = useTranslation(KNOWLEDGE_NAMESPACE);
  const { form, fieldError, formError, submitting } = useRenameKnowledgeSourceForm(
    knowledgeBaseId,
    source,
    onClose,
  );

  return (
    <RenameModal
      title={t('sources.rename.title', { name: source.title })}
      description={t('sources.rename.description')}
      submitLabel={t('sources.rename.submit')}
      submitting={submitting}
      error={formError}
      onSubmit={() => void form.handleSubmit()}
      onClose={onClose}
    >
      <form.AppField name={KnowledgeFormField.Title}>
        {(field) => (
          <field.TextField
            label={t('sources.rename.nameLabel')}
            autoComplete="off"
            type="text"
            error={fieldError}
          />
        )}
      </form.AppField>
    </RenameModal>
  );
}
