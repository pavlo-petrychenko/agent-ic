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
  Delete = 'delete',
}
