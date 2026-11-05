import { ErrorReason, KnowledgeDocumentFailureCode } from '@agent-ic/contracts';
import type {
  KnowledgeFailureSummaryCode,
  KnowledgeFailureSummaryKey,
  KnowledgeFailureTranslationKey,
} from '@/features/knowledge/typedefs/knowledgeFailure.typedefs';

const ERROR_REASONS: ReadonlySet<string> = new Set(Object.values(ErrorReason));
const DOCUMENT_FAILURE_CODES: ReadonlySet<string> = new Set(
  Object.values(KnowledgeDocumentFailureCode),
);

const SUMMARY_CODES: ReadonlySet<string> = new Set([
  ...Object.values(KnowledgeDocumentFailureCode),
  ErrorReason.Internal,
  ErrorReason.UpstreamFailed,
  ErrorReason.RateLimited,
  ErrorReason.LlmUnavailable,
  ErrorReason.LlmNotConfigured,
  ErrorReason.EmbeddingDimensionMismatch,
  ErrorReason.KnowledgeConnectionNotFound,
  ErrorReason.KnowledgeDocumentInvalid,
]);

export const knowledgeFailureTranslationKey = (
  code: string | null,
): KnowledgeFailureTranslationKey | null => {
  if (code === null) {
    return null;
  }
  return ERROR_REASONS.has(code) || DOCUMENT_FAILURE_CODES.has(code)
    ? `reason.${code as ErrorReason | KnowledgeDocumentFailureCode}`
    : 'reason.INTERNAL';
};

export const knowledgeFailureSummaryKey = (
  code: string | null,
): KnowledgeFailureSummaryKey | null => {
  if (code === null || !SUMMARY_CODES.has(code)) {
    return null;
  }
  return `reasonShort.${code as KnowledgeFailureSummaryCode}`;
};
