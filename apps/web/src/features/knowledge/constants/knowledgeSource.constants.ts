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

export enum KnowledgeScheduleMode {
  Manual = 'manual',
  Scheduled = 'scheduled',
}

export const KNOWLEDGE_SCHEDULE_DEFAULT_TIME = '06:00';
export const KNOWLEDGE_SCHEDULE_DEFAULT_WEEKDAY = 1;
export const KNOWLEDGE_SCHEDULE_PRESETS: readonly KnowledgeSyncInterval[] = [
  KnowledgeSyncInterval.Daily,
  KnowledgeSyncInterval.Weekly,
  KnowledgeSyncInterval.Hourly,
];

export const KNOWLEDGE_SOURCE_POLL_INTERVAL_MS = 2000;

export const KNOWLEDGE_SOURCE_DATE_FORMAT: Intl.DateTimeFormatOptions = {
  month: 'short',
  day: 'numeric',
};

export enum KnowledgeSourceMenuAction {
  Sync = 'sync',
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
