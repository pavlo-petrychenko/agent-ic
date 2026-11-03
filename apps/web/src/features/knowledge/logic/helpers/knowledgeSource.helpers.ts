import {
  KNOWLEDGE_SOURCE_DATE_FORMAT,
  KNOWLEDGE_SOURCE_NON_RETRYABLE_CODES,
  KnowledgeSourceStatus,
} from '@/features/knowledge/constants/knowledgeSource.constants';

export const isKnowledgeSourceActive = (status: KnowledgeSourceStatus): boolean =>
  status === KnowledgeSourceStatus.Pending || status === KnowledgeSourceStatus.Indexing;

export const isKnowledgeSourceRetryable = (
  status: KnowledgeSourceStatus,
  lastErrorCode: string | null,
): boolean =>
  status === KnowledgeSourceStatus.Error &&
  (lastErrorCode === null || !KNOWLEDGE_SOURCE_NON_RETRYABLE_CODES.has(lastErrorCode));

export const formatKnowledgeSourceDate = (iso: string, locale: string): string =>
  new Intl.DateTimeFormat(locale, KNOWLEDGE_SOURCE_DATE_FORMAT).format(new Date(iso));
