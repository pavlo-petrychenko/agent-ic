import { SECONDS_PER_MINUTE } from '@/platform/clock/constants/time.constants';
import { defineRateLimitPolicy } from '@/platform/rate-limit/helpers/rate-limit.helpers';

export const KNOWLEDGE_SEARCH_QUERY_MAX_LENGTH = 1000;
export const KNOWLEDGE_SEARCH_TERM_LIMIT = 64;
export const KNOWLEDGE_SEARCH_VECTOR_LIMIT = 50;
export const KNOWLEDGE_SEARCH_BM25_LIMIT = 50;
export const KNOWLEDGE_SEARCH_TRIGRAM_LIMIT = 20;
export const KNOWLEDGE_SEARCH_TRIGRAM_THRESHOLD = 0.2;
export const KNOWLEDGE_SEARCH_RRF_K = 60;
export const KNOWLEDGE_SEARCH_VECTOR_WEIGHT = 1;
export const KNOWLEDGE_SEARCH_BM25_WEIGHT = 1;
export const KNOWLEDGE_SEARCH_TRIGRAM_WEIGHT = 0.5;
export const KNOWLEDGE_SEARCH_RESULT_LIMIT = 6;
export const KNOWLEDGE_SEARCH_TOKEN_LIMIT = 4000;
export const KNOWLEDGE_SEARCH_TEXT_MAX_LENGTH = 12_000;
export const KNOWLEDGE_SEARCH_SECTION_TOKEN_LIMIT = 1500;
export const KNOWLEDGE_SEARCH_NEIGHBOUR_COUNT = 1;
export const KNOWLEDGE_SEARCH_TEXT_MARGIN = 4;
export const KNOWLEDGE_SEARCH_TEXT_SEPARATOR = '\n\n';
export const KNOWLEDGE_SEARCH_DEFAULT_TOP_K = 3;
export const KNOWLEDGE_SEARCH_MIN_TOP_K = 1;
export const KNOWLEDGE_SEARCH_MAX_TOP_K = 6;
export const KNOWLEDGE_SEARCH_BM25_K1 = 1.2;
export const KNOWLEDGE_SEARCH_BM25_B = 0.75;
export const KNOWLEDGE_SEARCH_TRACE_NAME = 'knowledge.search';

const KNOWLEDGE_SEARCHES_PER_MINUTE = 30;

export const KNOWLEDGE_SEARCH_RATE_LIMIT = defineRateLimitPolicy({
  name: 'knowledge-search',
  capacity: KNOWLEDGE_SEARCHES_PER_MINUTE,
  refillPerSecond: KNOWLEDGE_SEARCHES_PER_MINUTE / SECONDS_PER_MINUTE,
});
