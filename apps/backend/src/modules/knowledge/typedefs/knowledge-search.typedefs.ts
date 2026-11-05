import type { KnowledgeSourceKind } from '@/modules/knowledge/constants/knowledge.constants';

export interface KnowledgeSearchCandidate {
  readonly chunkId: string;
  readonly chunkOrdinal: number;
  readonly sectionId: string;
  readonly documentId: string;
  readonly documentTitle: string;
  readonly sourceId: string;
  readonly sourceTitle: string;
  readonly sourceKind: KnowledgeSourceKind;
  readonly path: string;
  readonly content: string;
  readonly tokenCount: number;
  readonly sectionTokenCount: number;
  readonly url: string | null;
}

export interface KnowledgeSearchLists {
  readonly vector: readonly KnowledgeSearchCandidate[];
  readonly bm25: readonly KnowledgeSearchCandidate[];
  readonly trigram: readonly KnowledgeSearchCandidate[];
}

export interface KnowledgeSectionMatch {
  readonly sectionId: string;
  readonly score: number;
  readonly candidate: KnowledgeSearchCandidate;
}

export interface KnowledgeSearchText {
  readonly sectionId: string;
  readonly text: string;
  readonly tokenCount: number;
}

export interface KnowledgeSearchResult {
  readonly documentId: string;
  readonly documentTitle: string;
  readonly sourceId: string;
  readonly sourceTitle: string;
  readonly sourceKind: KnowledgeSourceKind;
  readonly path: string;
  readonly text: string;
  readonly score: number;
  readonly url: string | null;
}

export interface KnowledgeSearchInput {
  readonly knowledgeBaseId: string;
  readonly query: string;
  readonly topK?: number | null;
}

export interface KnowledgeSearchScope {
  readonly sourceId?: string | null;
  readonly documentId?: string | null;
}

export interface KnowledgeSearchQueryInput extends KnowledgeSearchScope {
  readonly workspaceId: string;
  readonly knowledgeBaseId: string;
  readonly query: string;
  readonly topK: number;
}

export interface KnowledgeEmbeddingQueryInput {
  readonly workspaceId: string;
  readonly model: string;
  readonly dimensions: number;
  readonly query: string;
}
