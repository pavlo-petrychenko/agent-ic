export enum KnowledgeDocumentStatus {
  Pending = 'pending',
  Indexing = 'indexing',
  Indexed = 'indexed',
  Error = 'error',
  Removed = 'removed',
}

export enum KnowledgeDocumentStaleReason {
  Missing = 'missing',
  Trashed = 'trashed',
  Gone = 'gone',
}
