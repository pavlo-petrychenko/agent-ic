import type { KnowledgeBase } from '@/features/knowledge/typedefs/knowledgeBase.typedefs';

export interface KnowledgeBaseFieldViewProps {
  readonly selected: readonly KnowledgeBase[];
  readonly missingIds: readonly string[];
  readonly loading: boolean;
  readonly failed: boolean;
  readonly error: string | null;
  readonly onRemove: (id: string) => void;
  readonly onAttach: () => void;
  readonly onRetry: () => void;
}
