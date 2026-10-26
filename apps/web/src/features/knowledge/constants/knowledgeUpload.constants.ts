import { KNOWLEDGE_DOCUMENT_MAX_BYTES, KnowledgeDocumentFormat } from '@agent-ic/contracts';

export const KNOWLEDGE_UPLOAD_EXTENSIONS: readonly string[] = Object.values(
  KnowledgeDocumentFormat,
).map((format) => `.${format}`);

export const KNOWLEDGE_UPLOAD_MIME_TYPES: Readonly<Record<string, string>> = {
  '.pdf': 'application/pdf',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.txt': 'text/plain',
  '.md': 'text/markdown',
};

export const KNOWLEDGE_UPLOAD_UNKNOWN_MIME_TYPE = 'application/octet-stream';

export const KNOWLEDGE_UPLOAD_MAX_MEGABYTES = Math.floor(
  KNOWLEDGE_DOCUMENT_MAX_BYTES / (1024 * 1024),
);

export const KNOWLEDGE_FILE_BYTES_PER_KILOBYTE = 1024;
export const KNOWLEDGE_FILE_BYTES_PER_MEGABYTE = 1024 * 1024;
export const KNOWLEDGE_FILE_SIZE_DECIMAL_PLACES = 1;
export const KNOWLEDGE_FILE_ID_SEPARATOR = '\u0000';

export enum KnowledgeFileStatus {
  Ready = 'ready',
  Uploading = 'uploading',
  Uploaded = 'uploaded',
  Failed = 'failed',
  Skipped = 'skipped',
}

export enum KnowledgeFileSkipReason {
  Unsupported = 'unsupported',
  TooLarge = 'too-large',
  Empty = 'empty',
}
