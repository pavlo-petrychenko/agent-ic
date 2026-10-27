import type { KnowledgeSourceRowView } from '@/features/knowledge/typedefs/knowledgeSource.typedefs';

export interface DeleteKnowledgeSourceDialogProps {
  readonly knowledgeBaseId: string;
  readonly source: KnowledgeSourceRowView;
  readonly onDeleted: () => void;
  readonly onClose: () => void;
}
