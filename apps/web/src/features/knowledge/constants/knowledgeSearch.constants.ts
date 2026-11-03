import { KnowledgeSourceKind } from '@/features/knowledge/constants/knowledgeSource.constants';

export const KNOWLEDGE_SEARCH_QUERY_MAX_LENGTH = 1000;
export const KNOWLEDGE_SEARCH_DEFAULT_TOP_K = 3;
export const KNOWLEDGE_SEARCH_TOP_K_OPTIONS = [3, 5, 6] as const;
export const KNOWLEDGE_SEARCH_TEXT_PREVIEW_LENGTH = 180;
export const KNOWLEDGE_SEARCH_SCORE_PRECISION = 2;

export const KNOWLEDGE_SEARCH_KIND_LABEL_KEY = {
  [KnowledgeSourceKind.Upload]: 'sources.kind.upload',
  [KnowledgeSourceKind.GoogleDocs]: 'sources.kind.googleDocs',
} as const;
