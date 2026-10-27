import type { KnowledgeBase } from '@/features/knowledge/typedefs/knowledgeBase.typedefs';

export interface RenameKnowledgeBaseDialogProps {
  readonly knowledgeBase: KnowledgeBase;
  readonly onClose: () => void;
}
