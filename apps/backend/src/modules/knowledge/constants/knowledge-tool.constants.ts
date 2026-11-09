import { z } from 'zod';
import {
  KNOWLEDGE_SEARCH_DEFAULT_TOP_K,
  KNOWLEDGE_SEARCH_MAX_TOP_K,
  KNOWLEDGE_SEARCH_MIN_TOP_K,
  KNOWLEDGE_SEARCH_QUERY_MAX_LENGTH,
} from '@/modules/knowledge/constants/knowledge-search.constants';

export enum KnowledgeToolErrorCode {
  SearchUnavailable = 'search_unavailable',
  KnowledgeBaseMissing = 'knowledge_base_missing',
}

export const KNOWLEDGE_TOOL_SOURCE_ID_DESCRIPTION =
  'Optional. Only pass a source_id returned by an earlier result of this tool, to search inside that source. Leave null otherwise; never invent one.';
export const KNOWLEDGE_TOOL_DOCUMENT_ID_DESCRIPTION =
  'Optional. Only pass a document_id returned by an earlier result of this tool, to search inside that document. Leave null otherwise; never invent one.';

export const knowledgeToolInputSchema = z.object({
  query: z.string().trim().min(1).max(KNOWLEDGE_SEARCH_QUERY_MAX_LENGTH),
  top_k: z
    .number()
    .int()
    .min(KNOWLEDGE_SEARCH_MIN_TOP_K)
    .max(KNOWLEDGE_SEARCH_MAX_TOP_K)
    .default(KNOWLEDGE_SEARCH_DEFAULT_TOP_K),
  source_id: z.string().nullable().optional().describe(KNOWLEDGE_TOOL_SOURCE_ID_DESCRIPTION),
  document_id: z.string().nullable().optional().describe(KNOWLEDGE_TOOL_DOCUMENT_ID_DESCRIPTION),
});

export const KNOWLEDGE_TOOL_SEARCH_UNAVAILABLE_MESSAGE =
  'The knowledge base search is temporarily unavailable.';
export const KNOWLEDGE_TOOL_KNOWLEDGE_BASE_MISSING_MESSAGE =
  'This knowledge base no longer exists.';
