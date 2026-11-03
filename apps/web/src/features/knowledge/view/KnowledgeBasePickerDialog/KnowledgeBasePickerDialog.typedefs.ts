import type { KnowledgeBase } from '@/features/knowledge/typedefs/knowledgeBase.typedefs';

export interface KnowledgeBasePickerDialogProps {
  readonly knowledgeBases: readonly KnowledgeBase[];
  readonly selectedIds: readonly string[];
  readonly loading: boolean;
  readonly failed: boolean;
  readonly onToggle: (id: string) => void;
  readonly onRetry: () => void;
  readonly onClose: () => void;
}
