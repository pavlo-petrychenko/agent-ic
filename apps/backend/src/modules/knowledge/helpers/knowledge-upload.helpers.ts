import { KNOWLEDGE_DOCUMENT_MAX_BYTES } from '@agent-ic/contracts';
import { DocumentParseError } from '@/modules/knowledge/errors/document-parse.error';
import { KnowledgeUploadInvalidError } from '@/modules/knowledge/errors/knowledge-upload-invalid.error';
import { documentFileName } from '@/modules/knowledge/helpers/document-file-name.helpers';
import {
  normalizeDocumentMimeType,
  resolveDocumentFormat,
} from '@/modules/knowledge/helpers/document-format.helpers';
import { documentTitle } from '@/modules/knowledge/helpers/document-title.helpers';

export const uploadFileName = (fileName: string): string => documentFileName(fileName).baseName;

export const uploadTitle = (fileName: string): string => documentTitle(fileName).title;

export const validateUploadFile = (
  fileName: string,
  mimeType: string,
  sizeBytes: number,
): string => {
  if (sizeBytes <= 0 || sizeBytes > KNOWLEDGE_DOCUMENT_MAX_BYTES) {
    throw new KnowledgeUploadInvalidError();
  }
  try {
    resolveDocumentFormat(fileName, mimeType);
  } catch (error) {
    if (error instanceof DocumentParseError) {
      throw new KnowledgeUploadInvalidError();
    }
    throw error;
  }
  const normalized = normalizeDocumentMimeType(mimeType);
  if (normalized.length === 0) {
    throw new KnowledgeUploadInvalidError();
  }
  return normalized;
};
