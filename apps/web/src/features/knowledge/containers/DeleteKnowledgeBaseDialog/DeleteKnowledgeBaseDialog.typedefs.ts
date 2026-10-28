import type { KnowledgeBase } from '@/features/knowledge/typedefs/knowledgeBase.typedefs';

export interface DeleteKnowledgeBaseDialogProps {
  readonly workspaceId: string;
  readonly knowledgeBase: KnowledgeBase;
  readonly onClose: () => void;
}
