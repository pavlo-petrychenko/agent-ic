import type { KnowledgeBase } from '@/features/knowledge/typedefs/knowledgeBase.typedefs';

export interface EditKnowledgeBaseToolDialogProps {
  readonly knowledgeBase: KnowledgeBase;
  readonly attached: boolean;
  readonly onClose: () => void;
}
