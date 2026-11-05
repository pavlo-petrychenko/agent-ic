import type { KnowledgeSourceTarget } from '@/features/knowledge/typedefs/knowledgeSource.typedefs';

export interface KnowledgeSourceDetailsDrawerProps {
  readonly sourceId: string;
  readonly canManage: boolean;
  readonly retrying: boolean;
  readonly syncing: boolean;
  readonly onClose: () => void;
  readonly onSync: ((source: KnowledgeSourceTarget) => void) | null;
  readonly onRename: (source: KnowledgeSourceTarget) => void;
  readonly onRetry: (source: KnowledgeSourceTarget) => void;
  readonly onDelete: (source: KnowledgeSourceTarget) => void;
  readonly onReconnect: (() => void) | null;
  readonly reconnecting: boolean;
}
