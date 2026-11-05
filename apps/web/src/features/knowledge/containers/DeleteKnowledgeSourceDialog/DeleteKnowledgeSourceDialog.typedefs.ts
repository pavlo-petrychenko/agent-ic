import type { KnowledgeSourceTarget } from '@/features/knowledge/typedefs/knowledgeSource.typedefs';

export interface DeleteKnowledgeSourceDialogProps {
  readonly knowledgeBaseId: string;
  readonly source: KnowledgeSourceTarget;
  readonly onDeleted: () => void;
  readonly onClose: () => void;
}
