import { z } from 'zod';
import {
  KNOWLEDGE_SEARCH_DEFAULT_TOP_K,
  KNOWLEDGE_SEARCH_MAX_TOP_K,
  KNOWLEDGE_SEARCH_MIN_TOP_K,
  KNOWLEDGE_SEARCH_QUERY_MAX_LENGTH,
} from '@/modules/knowledge/constants/knowledge-search.constants';

export enum KnowledgeToolErrorCode {
  ScopeNotFound = 'scope_not_found',
  SearchUnavailable = 'search_unavailable',
  KnowledgeBaseMissing = 'knowledge_base_missing',
}

export const knowledgeToolInputSchema = z.object({
  query: z.string().trim().min(1).max(KNOWLEDGE_SEARCH_QUERY_MAX_LENGTH),
  top_k: z
    .number()
    .int()
    .min(KNOWLEDGE_SEARCH_MIN_TOP_K)
    .max(KNOWLEDGE_SEARCH_MAX_TOP_K)
    .default(KNOWLEDGE_SEARCH_DEFAULT_TOP_K),
  source_id: z.string().min(1).optional(),
  document_id: z.string().min(1).optional(),
});

export const KNOWLEDGE_TOOL_SCOPE_NOT_FOUND_MESSAGE =
  'The requested source or document does not belong to this knowledge base.';
export const KNOWLEDGE_TOOL_SEARCH_UNAVAILABLE_MESSAGE =
  'The knowledge base search is temporarily unavailable.';
export const KNOWLEDGE_TOOL_KNOWLEDGE_BASE_MISSING_MESSAGE =
  'This knowledge base no longer exists.';
