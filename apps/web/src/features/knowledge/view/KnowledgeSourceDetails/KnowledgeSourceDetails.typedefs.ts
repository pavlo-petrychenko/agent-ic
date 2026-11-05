import type { KnowledgeSourceDetail } from '@/features/knowledge/typedefs/knowledgeSource.typedefs';

export interface KnowledgeSourceDetailsProps {
  readonly detail: KnowledgeSourceDetail | null;
  readonly loading: boolean;
  readonly failed: boolean;
  readonly retrying: boolean;
  readonly canManage: boolean;
  readonly canRetry: boolean;
  readonly addedLabel: string | null;
  readonly onReload: () => void;
  readonly onClose: () => void;
  readonly onRename: (() => void) | null;
  readonly onRetry: (() => void) | null;
  readonly onDelete: (() => void) | null;
}
