import type {
  KnowledgeDocumentStatus,
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

export interface ListKnowledgeSourcesInput {
  readonly knowledgeBaseId: string;
}

export interface GetKnowledgeSourceInput {
  readonly id: string;
}

export interface KnowledgeSourceDocumentView {
  readonly id: string;
  readonly title: string;
  readonly status: KnowledgeDocumentStatus;
  readonly summary: string | null;
  readonly errorCode: string | null;
  readonly errorMessage: string | null;
  readonly tokenCount: number;
  readonly chunkCount: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface KnowledgeSourceDetailView {
  readonly source: KnowledgeSourceView;
  readonly documents: readonly KnowledgeSourceDocumentView[];
}

export interface DeleteKnowledgeSourceInput {
  readonly id: string;
}

export interface RetryKnowledgeSourceInput {
  readonly id: string;
}

export interface RenameKnowledgeSourceInput {
  readonly id: string;
  readonly title: string;
}
