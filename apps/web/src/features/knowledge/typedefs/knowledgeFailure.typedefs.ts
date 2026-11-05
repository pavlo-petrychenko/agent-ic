import type { ErrorReason, KnowledgeDocumentFailureCode } from '@agent-ic/contracts';

export type KnowledgeFailureTranslationKey = `reason.${ErrorReason | KnowledgeDocumentFailureCode}`;

export type KnowledgeFailureSummaryCode =
  | KnowledgeDocumentFailureCode
  | ErrorReason.Internal
  | ErrorReason.UpstreamFailed
  | ErrorReason.RateLimited
  | ErrorReason.LlmUnavailable
  | ErrorReason.LlmNotConfigured
  | ErrorReason.EmbeddingDimensionMismatch
  | ErrorReason.KnowledgeConnectionNotFound
  | ErrorReason.KnowledgeDocumentInvalid;

export type KnowledgeFailureSummaryKey = `reasonShort.${KnowledgeFailureSummaryCode}`;
