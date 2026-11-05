import type { GoogleConnection } from '@/features/knowledge/typedefs/googleConnection.typedefs';
import type { KnowledgeSourceDetailView } from '@/features/knowledge/typedefs/knowledgeSource.typedefs';

export interface KnowledgeSourceDetailsProps {
  readonly detail: KnowledgeSourceDetailView | null;
  readonly sourceFailureMessage: string | null;
  readonly connection: GoogleConnection | null;
  readonly reconnecting: boolean;
  readonly onReconnect: (() => void) | null;
  readonly loading: boolean;
  readonly failed: boolean;
  readonly retrying: boolean;
  readonly syncing: boolean;
  readonly canManage: boolean;
  readonly canRetry: boolean;
  readonly canSync: boolean;
  readonly addedLabel: string | null;
  readonly lastSyncedLabel: string | null;
  readonly onReload: () => void;
  readonly onClose: () => void;
  readonly onSync: (() => void) | null;
  readonly onRename: (() => void) | null;
  readonly onRetry: (() => void) | null;
  readonly onDelete: (() => void) | null;
}
