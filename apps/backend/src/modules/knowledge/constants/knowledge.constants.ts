export const KNOWLEDGE_SCHEMA = 'knowledge';

export const KNOWLEDGE_EMBEDDING_DIMENSIONS = 1024;

export const KNOWLEDGE_MIN_HEADING_LEVEL = 1;
export const KNOWLEDGE_MAX_HEADING_LEVEL = 6;
export const KNOWLEDGE_MIN_COUNT = 0;
export const KNOWLEDGE_MIN_FREQUENCY = 1;

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

export enum KnowledgeSyncMode {
  Manual = 'manual',
  Once = 'once',
  Scheduled = 'scheduled',
}

export enum KnowledgeSyncInterval {
  Hourly = 'hourly',
  Daily = 'daily',
  Weekly = 'weekly',
}

export enum KnowledgeSyncTrigger {
  Initial = 'initial',
  Manual = 'manual',
  Scheduled = 'scheduled',
}

export enum KnowledgeSyncStatus {
  Queued = 'queued',
  Running = 'running',
  Succeeded = 'succeeded',
  Partial = 'partial',
  Failed = 'failed',
}

export enum KnowledgeDocumentStatus {
  Pending = 'pending',
  Indexing = 'indexing',
  Indexed = 'indexed',
  Error = 'error',
  Removed = 'removed',
}

export enum KnowledgeSummarySource {
  Auto = 'auto',
  User = 'user',
}

export enum KnowledgeConnectionProvider {
  GoogleDocs = 'google_docs',
}

export enum KnowledgeConnectionStatus {
  Active = 'active',
  Revoked = 'revoked',
  Error = 'error',
}
