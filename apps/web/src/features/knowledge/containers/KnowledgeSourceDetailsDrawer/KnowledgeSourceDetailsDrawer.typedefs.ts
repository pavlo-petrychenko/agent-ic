import type { KnowledgeSourceTarget } from '@/features/knowledge/typedefs/knowledgeSource.typedefs';

export interface KnowledgeSourceDetailsDrawerProps {
  readonly sourceId: string;
  readonly canManage: boolean;
  readonly retrying: boolean;
  readonly onClose: () => void;
  readonly onRename: (source: KnowledgeSourceTarget) => void;
  readonly onRetry: (source: KnowledgeSourceTarget) => void;
  readonly onDelete: (source: KnowledgeSourceTarget) => void;
}
