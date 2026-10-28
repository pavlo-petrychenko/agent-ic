import type { KnowledgeDocumentFormat } from '@agent-ic/contracts';
import {
  DOCUMENT_FORMATS,
  DOCUMENT_MIME_TYPE_SEPARATOR,
  DocumentParseErrorCode,
} from '@/modules/knowledge/constants/document-parser.constants';
import { DocumentParseError } from '@/modules/knowledge/errors/document-parse.error';
import { documentFileName } from '@/modules/knowledge/helpers/document-file-name.helpers';

const normalizedMimeType = (mimeType: string): string =>
  mimeType.split(DOCUMENT_MIME_TYPE_SEPARATOR)[0]?.trim().toLowerCase() ?? '';

const formatByMimeType = (mimeType: string): KnowledgeDocumentFormat | null =>
  DOCUMENT_FORMATS.find((definition) => definition.mimeTypes.includes(mimeType))?.format ?? null;

const formatByExtension = (extension: string): KnowledgeDocumentFormat | null =>
  DOCUMENT_FORMATS.find((definition) => definition.extensions.includes(extension))?.format ?? null;

export const resolveDocumentFormat = (
  fileName: string,
  mimeType: string,
): KnowledgeDocumentFormat => {
  const format =
    formatByExtension(documentFileName(fileName).extension) ??
    formatByMimeType(normalizedMimeType(mimeType));

  if (format === null) {
    throw new DocumentParseError(DocumentParseErrorCode.UnsupportedType);
  }
  return format;
};
