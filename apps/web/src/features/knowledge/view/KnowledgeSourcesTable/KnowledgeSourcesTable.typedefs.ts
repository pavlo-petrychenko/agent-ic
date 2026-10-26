import type { KnowledgeSourceRowView } from '@/features/knowledge/typedefs/knowledgeSource.typedefs';

export interface KnowledgeSourcesTableError {
  readonly message: string;
  readonly retryLabel: string;
  readonly onRetry: () => void;
}

export interface KnowledgeSourcesTableProps {
  readonly rows: readonly KnowledgeSourceRowView[];
  readonly loading: boolean;
  readonly error: KnowledgeSourcesTableError | null;
  readonly onAddSource: (() => void) | null;
}
