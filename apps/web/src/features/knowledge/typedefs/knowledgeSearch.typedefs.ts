import type { KnowledgeSourceKind } from '@/features/knowledge/constants/knowledgeSource.constants';

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

export interface PlaygroundResultView {
  readonly key: string;
  readonly sourceTitle: string;
  readonly scoreLabel: string;
  readonly scorePercent: number;
  readonly text: string;
  readonly isLong: boolean;
}

export interface UseKnowledgeSearchResult {
  readonly results: readonly KnowledgeSearchResult[];
  readonly loading: boolean;
  readonly failed: boolean;
  readonly error: unknown;
  readonly searched: boolean;
  readonly search: (query: string, topK: number) => Promise<void>;
}
