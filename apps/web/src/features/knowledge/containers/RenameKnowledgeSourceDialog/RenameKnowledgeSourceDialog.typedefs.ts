import type { KnowledgeSourceRowView } from '@/features/knowledge/typedefs/knowledgeSource.typedefs';

export interface RenameKnowledgeSourceDialogProps {
  readonly knowledgeBaseId: string;
  readonly source: KnowledgeSourceRowView;
  readonly onClose: () => void;
}
