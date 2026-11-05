import {
  KNOWLEDGE_EMBEDDING_DIMENSIONS,
  KnowledgeConnectionProvider,
  KnowledgeConnectionStatus,
  KnowledgeDocumentStatus,
  KnowledgeSourceKind,
  KnowledgeSourceStatus,
  KnowledgeSyncStatus,
  KnowledgeSyncTrigger,
} from '@/modules/knowledge/constants/knowledge.constants';
import type { NewChunkTerm } from '@/modules/knowledge/typedefs/chunk-term.typedefs';
import type { NewChunk } from '@/modules/knowledge/typedefs/chunk.typedefs';
import type { NewConnection } from '@/modules/knowledge/typedefs/connection.typedefs';
import type { NewDocument } from '@/modules/knowledge/typedefs/document.typedefs';
import type { NewEmbeddingCacheEntry } from '@/modules/knowledge/typedefs/embedding-cache.typedefs';
import type { NewKnowledgeBase } from '@/modules/knowledge/typedefs/knowledge-base.typedefs';
import type { NewSection } from '@/modules/knowledge/typedefs/section.typedefs';
import type { NewSource } from '@/modules/knowledge/typedefs/source.typedefs';
import type { NewSyncRun } from '@/modules/knowledge/typedefs/sync-run.typedefs';
import {
  TEST_CHUNK_CONTENT,
  TEST_CHUNK_INDEX_TEXT,
  TEST_CHUNK_TERM,
  TEST_CONNECTION_EMAIL,
  TEST_CONNECTION_SEALED_TOKEN,
  TEST_CONNECTION_SUBJECT,
  TEST_CONTENT_HASH,
  TEST_DOCUMENT_MIME_TYPE,
  TEST_DOCUMENT_TITLE,
  TEST_EMBEDDING_MODEL,
  TEST_EMBEDDING_TEXT_HASH,
  TEST_EMBEDDING_VECTOR,
  TEST_KB_NAME,
  TEST_KB_TOOL_NAME,
  TEST_SECTION_PATH,
  TEST_SOURCE_TITLE,
} from '@test/support/constants/knowledge-testing.constants';

export const newKnowledgeBase = (id: string, workspaceId: string): NewKnowledgeBase => ({
  id,
  workspaceId,
  name: TEST_KB_NAME,
  toolName: TEST_KB_TOOL_NAME,
  embeddingModel: TEST_EMBEDDING_MODEL,
  embeddingDimensions: KNOWLEDGE_EMBEDDING_DIMENSIONS,
});

export const newConnection = (
  id: string,
  workspaceId: string,
  overrides: Partial<NewConnection> = {},
): NewConnection => ({
  id,
  workspaceId,
  provider: KnowledgeConnectionProvider.GoogleDocs,
  accountEmail: TEST_CONNECTION_EMAIL,
  accountSubject: TEST_CONNECTION_SUBJECT,
  sealedRefreshToken: TEST_CONNECTION_SEALED_TOKEN,
  status: KnowledgeConnectionStatus.Active,
  ...overrides,
});

export const newSource = (
  id: string,
  workspaceId: string,
  kbId: string,
  overrides: Partial<NewSource> = {},
): NewSource => ({
  id,
  workspaceId,
  kbId,
  kind: KnowledgeSourceKind.Upload,
  title: TEST_SOURCE_TITLE,
  status: KnowledgeSourceStatus.Pending,
  ...overrides,
});

export const newDocument = (
  id: string,
  workspaceId: string,
  kbId: string,
  sourceId: string,
): NewDocument => ({
  id,
  workspaceId,
  kbId,
  sourceId,
  title: TEST_DOCUMENT_TITLE,
  mimeType: TEST_DOCUMENT_MIME_TYPE,
  status: KnowledgeDocumentStatus.Pending,
});

export const newSection = (
  id: string,
  workspaceId: string,
  kbId: string,
  documentId: string,
): NewSection => ({
  id,
  workspaceId,
  kbId,
  documentId,
  generation: 0,
  ordinal: 0,
  level: 1,
  path: TEST_SECTION_PATH,
  tokenCount: 10,
  contentHash: TEST_CONTENT_HASH,
});

export const newChunk = (
  id: string,
  workspaceId: string,
  kbId: string,
  documentId: string,
  sectionId: string,
): NewChunk => ({
  id,
  workspaceId,
  kbId,
  documentId,
  sectionId,
  generation: 0,
  ordinal: 0,
  content: TEST_CHUNK_CONTENT,
  indexText: TEST_CHUNK_INDEX_TEXT,
  contentHash: TEST_CONTENT_HASH,
  tokenCount: 10,
  embedding: TEST_EMBEDDING_VECTOR,
  embeddingModel: TEST_EMBEDDING_MODEL,
  embeddingDimensions: KNOWLEDGE_EMBEDDING_DIMENSIONS,
});

export const newChunkTerm = (workspaceId: string, kbId: string, chunkId: string): NewChunkTerm => ({
  workspaceId,
  kbId,
  chunkId,
  term: TEST_CHUNK_TERM,
  frequency: 1,
});

export const newSyncRun = (id: string, workspaceId: string, sourceId: string): NewSyncRun => ({
  id,
  workspaceId,
  sourceId,
  trigger: KnowledgeSyncTrigger.Initial,
  status: KnowledgeSyncStatus.Queued,
});

export const newEmbeddingCacheEntry = (workspaceId: string): NewEmbeddingCacheEntry => ({
  workspaceId,
  model: TEST_EMBEDDING_MODEL,
  dimensions: KNOWLEDGE_EMBEDDING_DIMENSIONS,
  textHash: TEST_EMBEDDING_TEXT_HASH,
  embedding: TEST_EMBEDDING_VECTOR,
});
