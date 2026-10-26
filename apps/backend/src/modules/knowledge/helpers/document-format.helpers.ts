import { basename, extname } from 'node:path';
import type { KnowledgeDocumentFormat } from '@agent-ic/contracts';
import {
  DOCUMENT_FORMATS,
  DOCUMENT_MIME_TYPE_SEPARATOR,
  DOCUMENT_PATH_SEPARATOR,
  DOCUMENT_WINDOWS_PATH_SEPARATOR,
  DocumentParseErrorCode,
} from '@/modules/knowledge/constants/document-parser.constants';
import { DocumentParseError } from '@/modules/knowledge/errors/document-parse.error';

const normalizedMimeType = (mimeType: string): string =>
  mimeType.split(DOCUMENT_MIME_TYPE_SEPARATOR)[0]?.trim().toLowerCase() ?? '';

const normalizedExtension = (fileName: string): string =>
  extname(
    basename(fileName.replaceAll(DOCUMENT_WINDOWS_PATH_SEPARATOR, DOCUMENT_PATH_SEPARATOR)),
  ).toLowerCase();

const formatByMimeType = (mimeType: string): KnowledgeDocumentFormat | null =>
  DOCUMENT_FORMATS.find((definition) => definition.mimeTypes.includes(mimeType))?.format ?? null;

const formatByExtension = (extension: string): KnowledgeDocumentFormat | null =>
  DOCUMENT_FORMATS.find((definition) => definition.extensions.includes(extension))?.format ?? null;

export const resolveDocumentFormat = (
  fileName: string,
  mimeType: string,
): KnowledgeDocumentFormat => {
  const format =
    formatByExtension(normalizedExtension(fileName)) ??
    formatByMimeType(normalizedMimeType(mimeType));

  if (format === null) {
    throw new DocumentParseError(DocumentParseErrorCode.UnsupportedType);
  }
  return format;
};
