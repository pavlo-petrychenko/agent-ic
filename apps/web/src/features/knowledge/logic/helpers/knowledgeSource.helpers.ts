import {
  KNOWLEDGE_SOURCE_DATE_FORMAT,
  KNOWLEDGE_SOURCE_NON_RETRYABLE_CODES,
  KnowledgeSourceKind,
  KnowledgeSourceStatus,
} from '@/features/knowledge/constants/knowledgeSource.constants';
import type { KnowledgeSource } from '@/features/knowledge/typedefs/knowledgeSource.typedefs';

export const isKnowledgeSourceActive = (status: KnowledgeSourceStatus): boolean =>
  status === KnowledgeSourceStatus.Pending || status === KnowledgeSourceStatus.Indexing;

export const isKnowledgeSourceRetryable = (
  status: KnowledgeSourceStatus,
  lastErrorCode: string | null,
): boolean =>
  status === KnowledgeSourceStatus.Error &&
  (lastErrorCode === null || !KNOWLEDGE_SOURCE_NON_RETRYABLE_CODES.has(lastErrorCode));

export const canSyncKnowledgeSource = (
  source: KnowledgeSource,
  connectionActive: boolean,
): boolean =>
  connectionActive &&
  source.kind === KnowledgeSourceKind.GoogleDocs &&
  source.status === KnowledgeSourceStatus.Ready;

export const formatKnowledgeSourceDate = (iso: string, locale: string): string =>
  new Intl.DateTimeFormat(locale, KNOWLEDGE_SOURCE_DATE_FORMAT).format(new Date(iso));
