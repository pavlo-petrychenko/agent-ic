import type { KnowledgeBaseUsage } from '@/features/knowledge/typedefs/knowledgeBase.typedefs';

export interface DeleteKnowledgeBaseInUseModalProps {
  readonly knowledgeBaseName: string;
  readonly usages: readonly KnowledgeBaseUsage[];
  readonly onOpenStep: (usage: KnowledgeBaseUsage) => void;
  readonly onClose: () => void;
}
