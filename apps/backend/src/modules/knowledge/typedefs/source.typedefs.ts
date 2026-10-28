import type {
  KnowledgeSourceKind,
  KnowledgeSourceStatus,
  KnowledgeSyncInterval,
} from '@/modules/knowledge/constants/knowledge.constants';
import type { sources } from '@/modules/knowledge/db/sources.table';

export type Source = typeof sources.$inferSelect;

export type NewSource = Omit<typeof sources.$inferInsert, 'createdAt' | 'updatedAt'>;

export type SourceChanges = Partial<Omit<NewSource, 'id' | 'workspaceId'>>;

export interface KnowledgeSourceView {
  readonly id: string;
  readonly knowledgeBaseId: string;
  readonly kind: KnowledgeSourceKind;
  readonly title: string;
  readonly status: KnowledgeSourceStatus;
  readonly syncInterval: KnowledgeSyncInterval | null;
  readonly nextSyncAt: Date | null;
  readonly lastSyncAt: Date | null;
  readonly lastErrorCode: string | null;
  readonly lastErrorMessage: string | null;
  readonly documentCount: number;
  readonly chunkCount: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
