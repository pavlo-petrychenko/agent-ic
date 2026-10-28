import {
  KNOWLEDGE_CONTENT_FILE_NAME,
  KNOWLEDGE_DOCUMENTS_ROOT,
  KNOWLEDGE_ORIGINAL_FILE_STEM,
  KNOWLEDGE_STORAGE_ROOT,
  KNOWLEDGE_UPLOADS_ROOT,
} from '@/modules/knowledge/constants/knowledge-storage.constants';
import { documentFileName } from '@/modules/knowledge/helpers/document-file-name.helpers';
import { workspaceStorageKey } from '@/platform/storage/helpers/storage-key.helpers';

const originalFileName = (fileName: string): string =>
  `${KNOWLEDGE_ORIGINAL_FILE_STEM}${documentFileName(fileName).extension}`;

export const knowledgeUploadStorageKey = (
  workspaceId: string,
  documentId: string,
  fileName: string,
): string =>
  workspaceStorageKey(
    workspaceId,
    KNOWLEDGE_STORAGE_ROOT,
    KNOWLEDGE_UPLOADS_ROOT,
    documentId,
    originalFileName(fileName),
  );

export const knowledgeOriginalStorageKey = (
  workspaceId: string,
  documentId: string,
  fileName: string,
): string =>
  workspaceStorageKey(
    workspaceId,
    KNOWLEDGE_STORAGE_ROOT,
    KNOWLEDGE_DOCUMENTS_ROOT,
    documentId,
    originalFileName(fileName),
  );

export const knowledgeContentStorageKey = (workspaceId: string, documentId: string): string =>
  workspaceStorageKey(
    workspaceId,
    KNOWLEDGE_STORAGE_ROOT,
    KNOWLEDGE_DOCUMENTS_ROOT,
    documentId,
    KNOWLEDGE_CONTENT_FILE_NAME,
  );
