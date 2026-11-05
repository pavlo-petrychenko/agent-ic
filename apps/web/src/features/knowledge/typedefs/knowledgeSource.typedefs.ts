import type { KnowledgeDocumentStatus } from '@/features/knowledge/constants/knowledgeDocument.constants';
import type {
  KnowledgeSourceKind,
  KnowledgeSourceStatus,
  KnowledgeSyncInterval,
} from '@/features/knowledge/constants/knowledgeSource.constants';
import type { GoogleConnection } from '@/features/knowledge/typedefs/googleConnection.typedefs';

export interface KnowledgeSource {
  readonly id: string;
  readonly knowledgeBaseId: string;
  readonly connectionId: string | null;
  readonly kind: KnowledgeSourceKind;
  readonly title: string;
  readonly status: KnowledgeSourceStatus;
  readonly syncInterval: KnowledgeSyncInterval | null;
  readonly nextSyncAt: string | null;
  readonly lastSyncAt: string | null;
  readonly lastErrorCode: string | null;
  readonly lastErrorMessage: string | null;
  readonly documentCount: number;
  readonly chunkCount: number;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface KnowledgeSourceRowView {
  readonly id: string;
  readonly title: string;
  readonly kindLabel: string;
  readonly syncLabel: string;
  readonly syncDetail: string;
  readonly status: KnowledgeSourceStatus;
  readonly isActive: boolean;
  readonly canRetry: boolean;
  readonly statusLabel: string;
  readonly statusDetail: string | null;
}

export interface KnowledgeSourceTarget {
  readonly id: string;
  readonly title: string;
}

export interface KnowledgeSourceDocument {
  readonly id: string;
  readonly title: string;
  readonly status: KnowledgeDocumentStatus;
  readonly summary: string | null;
  readonly errorCode: string | null;
  readonly errorMessage: string | null;
  readonly tokenCount: number;
  readonly chunkCount: number;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface KnowledgeSourceDetail {
  readonly source: KnowledgeSource;
  readonly connection: GoogleConnection | null;
  readonly documents: readonly KnowledgeSourceDocument[];
}

export interface KnowledgeSourceDocumentView extends KnowledgeSourceDocument {
  readonly failureMessage: string | null;
}

export interface KnowledgeSourceDetailView {
  readonly source: KnowledgeSource;
  readonly documents: readonly KnowledgeSourceDocumentView[];
}

export interface UseKnowledgeSourceDetailResult {
  readonly detail: KnowledgeSourceDetail | null;
  readonly loading: boolean;
  readonly failed: boolean;
  readonly retry: () => Promise<void>;
}

export interface UseKnowledgeSourcesResult {
  readonly sources: readonly KnowledgeSource[];
  readonly loading: boolean;
  readonly failed: boolean;
  readonly retry: () => Promise<void>;
}

export interface UseDeleteKnowledgeSourceResult {
  readonly deleteKnowledgeSource: (id: string) => Promise<void>;
  readonly deleting: boolean;
}

export interface UseRetryKnowledgeSourceResult {
  readonly retryKnowledgeSource: (id: string) => Promise<void>;
  readonly retryingSourceId: string | null;
}

export interface RenameKnowledgeSourceValues {
  readonly id: string;
  readonly title: string;
}

export interface UseRenameKnowledgeSourceResult {
  readonly renameKnowledgeSource: (values: RenameKnowledgeSourceValues) => Promise<void>;
  readonly renaming: boolean;
}
