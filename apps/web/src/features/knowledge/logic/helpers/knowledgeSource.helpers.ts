import {
  KNOWLEDGE_SOURCE_DATE_FORMAT,
  KnowledgeSourceStatus,
} from '@/features/knowledge/constants/knowledgeSource.constants';

export const isKnowledgeSourceActive = (status: KnowledgeSourceStatus): boolean =>
  status === KnowledgeSourceStatus.Pending || status === KnowledgeSourceStatus.Indexing;

export const formatKnowledgeSourceDate = (iso: string, locale: string): string =>
  new Intl.DateTimeFormat(locale, KNOWLEDGE_SOURCE_DATE_FORMAT).format(new Date(iso));
