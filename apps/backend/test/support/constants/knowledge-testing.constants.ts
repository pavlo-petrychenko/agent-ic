import { KNOWLEDGE_EMBEDDING_DIMENSIONS } from '@/modules/knowledge/constants/knowledge.constants';

export const KNOWLEDGE_TEST_START = new Date('2026-05-01T09:00:00.000Z');
export const KNOWLEDGE_TEST_LATER = new Date('2026-05-01T10:00:00.000Z');
export const TEST_KB_NAME = 'Handbook';
export const TEST_KB_NEW_NAME = 'Handbook v2';
export const TEST_KB_DESCRIPTION = 'Team handbook';
export const TEST_KB_TOOL_NAME = 'search_handbook';
export const TEST_EMBEDDING_MODEL = 'jina-embeddings-v5-text-small';
export const TEST_CONNECTION_EMAIL = 'owner@example.com';
export const TEST_CONNECTION_SUBJECT = 'google-owner-subject';
export const TEST_CONNECTION_SEALED_TOKEN = 'v1.sealed-google-refresh-token';
export const TEST_GOOGLE_ACCESS_TOKEN = 'test-google-access-token';
export const TEST_GOOGLE_REFRESH_TOKEN = 'test-google-refresh-token';
export const TEST_GOOGLE_SCOPE = 'openid email https://www.googleapis.com/auth/drive.file';
export const TEST_GOOGLE_AUTHORIZATION_URL = 'https://accounts.google.test/authorize';
export const TEST_GOOGLE_PICKER_API_KEY = 'test-google-picker-api-key';
export const TEST_GOOGLE_PICKER_APP_ID = '1234567890';
export const TEST_GOOGLE_DOC_ID = 'google-doc-1';
export const TEST_GOOGLE_DOC_NAME = 'Policies';
export const TEST_GOOGLE_DOC_MIME_TYPE = 'application/vnd.google-apps.document';
export const TEST_GOOGLE_DOC_MARKDOWN = '# Policies\n\nRefunds are processed within five days.';
export const TEST_GOOGLE_DOC_VERSION = '42';
export const TEST_GOOGLE_DOC_MODIFIED_AT = '2026-05-01T09:00:00.000Z';
export const TEST_GOOGLE_DOC_URL = 'https://docs.google.com/document/d/google-doc-1';
export const TEST_SOURCE_TITLE = 'Policies';
export const TEST_SOURCE_NEW_TITLE = 'Policies v2';
export const TEST_DOCUMENT_TITLE = 'Refund policy';
export const TEST_DOCUMENT_NEW_TITLE = 'Refund policy v2';
export const TEST_DOCUMENT_MIME_TYPE = 'text/markdown';
export const TEST_SECTION_PATH = 'Refund policy';
export const TEST_SECTION_NEW_PATH = 'Refund policy / Refunds';
export const TEST_CONTENT_HASH = 'hash-content';
export const TEST_CHUNK_CONTENT = 'Refunds are processed within five days.';
export const TEST_CHUNK_NEW_CONTENT = 'Refunds are processed within seven days.';
export const TEST_CHUNK_INDEX_TEXT = `${TEST_SECTION_PATH}\n${TEST_CHUNK_CONTENT}`;
export const TEST_CHUNK_TERM = 'refund';
export const TEST_CHUNK_TERM_FREQUENCY = 2;
export const TEST_EMBEDDING_TEXT_HASH = 'hash-embedding';
export const TEST_EMBEDDING_VECTOR = Array.from(
  { length: KNOWLEDGE_EMBEDDING_DIMENSIONS },
  () => 0.01,
);
export const TEST_EMBEDDING_VECTOR_UPDATED = Array.from(
  { length: KNOWLEDGE_EMBEDDING_DIMENSIONS },
  () => 0.02,
);
