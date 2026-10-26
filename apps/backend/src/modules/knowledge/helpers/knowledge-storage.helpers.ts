import {
  KNOWLEDGE_CONTENT_FILE_STEM,
  KNOWLEDGE_DOCUMENTS_ROOT,
  KNOWLEDGE_ORIGINAL_FILE_STEM,
  KNOWLEDGE_STORAGE_ROOT,
  KNOWLEDGE_UPLOADS_ROOT,
} from '@/modules/knowledge/constants/knowledge-storage.constants';
import { documentFileName } from '@/modules/knowledge/helpers/document-file-name.helpers';
import { workspaceStorageKey } from '@/platform/storage/helpers/storage-key.helpers';

const originalFileName = (fileName: string, version: string): string =>
  `${KNOWLEDGE_ORIGINAL_FILE_STEM}-${version}${documentFileName(fileName).extension}`;

const contentFileName = (generation: number): string =>
  `${KNOWLEDGE_CONTENT_FILE_STEM}-${generation}.md`;

export const knowledgeUploadStorageKey = (
  workspaceId: string,
  documentId: string,
  uploadId: string,
  fileName: string,
): string =>
  workspaceStorageKey(
    workspaceId,
    KNOWLEDGE_STORAGE_ROOT,
    KNOWLEDGE_UPLOADS_ROOT,
    documentId,
    uploadId,
    originalFileName(fileName, uploadId),
  );

export const knowledgeOriginalStorageKey = (
  workspaceId: string,
  documentId: string,
  version: string,
  fileName: string,
): string =>
  workspaceStorageKey(
    workspaceId,
    KNOWLEDGE_STORAGE_ROOT,
    KNOWLEDGE_DOCUMENTS_ROOT,
    documentId,
    originalFileName(fileName, version),
  );

export const knowledgeContentStorageKey = (
  workspaceId: string,
  documentId: string,
  generation: number,
): string =>
  workspaceStorageKey(
    workspaceId,
    KNOWLEDGE_STORAGE_ROOT,
    KNOWLEDGE_DOCUMENTS_ROOT,
    documentId,
    contentFileName(generation),
  );
