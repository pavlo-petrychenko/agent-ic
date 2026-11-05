import { useState } from 'react';
import { useKnowledgeBaseUsages } from '@/features/knowledge/communication/hooks/useKnowledgeBaseUsages';
import { EditKnowledgeBaseToolDialog } from '@/features/knowledge/containers/EditKnowledgeBaseToolDialog';
import type { KnowledgeAgentAccessSectionProps } from '@/features/knowledge/containers/KnowledgeAgentAccessSection/KnowledgeAgentAccessSection.typedefs';
import { knowledgeAgentNames } from '@/features/knowledge/logic/helpers/knowledgeAgentAccess.helpers';
import { KnowledgeAgentAccess } from '@/features/knowledge/view/KnowledgeAgentAccess';

export function KnowledgeAgentAccessSection({
  knowledgeBase,
  canEdit,
}: KnowledgeAgentAccessSectionProps) {
  const { usages, loading, failed, retry } = useKnowledgeBaseUsages(knowledgeBase.id);
  const [editing, setEditing] = useState(false);

  return (
    <>
      <KnowledgeAgentAccess
        knowledgeBase={knowledgeBase}
        agents={knowledgeAgentNames(usages)}
        loading={loading}
        failed={failed}
        canEdit={canEdit}
        onEdit={canEdit ? () => setEditing(true) : null}
        onRetry={() => void retry()}
      />
      {editing ? (
        <EditKnowledgeBaseToolDialog
          knowledgeBase={knowledgeBase}
          attached={usages.length > 0}
          onClose={() => setEditing(false)}
        />
      ) : null}
    </>
  );
}
