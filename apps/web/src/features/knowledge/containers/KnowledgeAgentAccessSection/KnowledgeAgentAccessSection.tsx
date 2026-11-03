import { useKnowledgeBaseUsages } from '@/features/knowledge/communication/hooks/useKnowledgeBaseUsages';
import type { KnowledgeAgentAccessSectionProps } from '@/features/knowledge/containers/KnowledgeAgentAccessSection/KnowledgeAgentAccessSection.typedefs';
import { KnowledgeAgentAccess } from '@/features/knowledge/view/KnowledgeAgentAccess';

export function KnowledgeAgentAccessSection({ knowledgeBase }: KnowledgeAgentAccessSectionProps) {
  const { usages, loading, failed, retry } = useKnowledgeBaseUsages(knowledgeBase.id);

  return (
    <KnowledgeAgentAccess
      knowledgeBase={knowledgeBase}
      usages={usages}
      loading={loading}
      failed={failed}
      onRetry={() => void retry()}
    />
  );
}
