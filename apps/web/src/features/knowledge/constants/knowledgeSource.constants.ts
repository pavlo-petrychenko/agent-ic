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
  Retry = 'retry',
  Delete = 'delete',
}

export const KNOWLEDGE_SOURCE_NON_RETRYABLE_CODES: ReadonlySet<string> = new Set([
  'UNSUPPORTED_DOCUMENT_TYPE',
  'DOCUMENT_TOO_LARGE',
  'DOCUMENT_TOO_MANY_TOKENS',
  'DOCUMENT_EMPTY',
  'DOCUMENT_SIGNATURE_MISMATCH',
  'PDF_HAS_NO_TEXT',
]);
