import { ErrorReason } from '@agent-ic/contracts';
import {
  KNOWLEDGE_SOURCE_DATE_FORMAT,
  KnowledgeSourceStatus,
} from '@/features/knowledge/constants/knowledgeSource.constants';

const ERROR_REASONS: ReadonlySet<string> = new Set(Object.values(ErrorReason));

export const isKnowledgeSourceErrorReason = (code: string): code is ErrorReason =>
  ERROR_REASONS.has(code);

export const isKnowledgeSourceActive = (status: KnowledgeSourceStatus): boolean =>
  status === KnowledgeSourceStatus.Pending || status === KnowledgeSourceStatus.Indexing;

export const formatKnowledgeSourceDate = (iso: string, locale: string): string =>
  new Intl.DateTimeFormat(locale, KNOWLEDGE_SOURCE_DATE_FORMAT).format(new Date(iso));
