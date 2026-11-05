import type { KnowledgeSourceTarget } from '@/features/knowledge/typedefs/knowledgeSource.typedefs';

export interface RenameKnowledgeSourceDialogProps {
  readonly knowledgeBaseId: string;
  readonly source: KnowledgeSourceTarget;
  readonly onClose: () => void;
}
