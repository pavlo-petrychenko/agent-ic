import type {
  KnowledgeSourceKind,
  KnowledgeSourceStatus,
  KnowledgeSyncInterval,
} from '@/features/knowledge/constants/knowledgeSource.constants';

export interface KnowledgeSource {
  readonly id: string;
  readonly knowledgeBaseId: string;
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
  readonly statusLabel: string;
  readonly statusDetail: string | null;
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
