import { ErrorReason, KnowledgeDocumentFailureCode } from '@agent-ic/contracts';

export enum KnowledgeSourceKind {
  Upload = 'upload',
  GoogleDocs = 'google_docs',
}

export enum KnowledgeSourceStatus {
  Pending = 'pending',
  Indexing = 'indexing',
  Ready = 'ready',
  Error = 'error',
}

export enum KnowledgeSyncInterval {
  Hourly = 'hourly',
  Daily = 'daily',
  Weekly = 'weekly',
}

export const KNOWLEDGE_SOURCE_POLL_INTERVAL_MS = 2000;

export const KNOWLEDGE_SOURCE_DATE_FORMAT: Intl.DateTimeFormatOptions = {
  month: 'short',
  day: 'numeric',
};

export enum KnowledgeSourceMenuAction {
  Rename = 'rename',
  Retry = 'retry',
  Delete = 'delete',
}

export const KNOWLEDGE_SOURCE_NON_RETRYABLE_CODES: ReadonlySet<string> = new Set([
  KnowledgeDocumentFailureCode.UnsupportedType,
  KnowledgeDocumentFailureCode.TooLarge,
  KnowledgeDocumentFailureCode.TooManyTokens,
  KnowledgeDocumentFailureCode.Empty,
  KnowledgeDocumentFailureCode.SignatureMismatch,
  KnowledgeDocumentFailureCode.PdfHasNoText,
  ErrorReason.EmbeddingDimensionMismatch,
  ErrorReason.KnowledgeConnectionNotFound,
]);
