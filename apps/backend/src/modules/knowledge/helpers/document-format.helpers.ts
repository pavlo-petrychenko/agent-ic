import { KnowledgeDocumentFormat } from '@agent-ic/contracts';
import {
  DOCUMENT_FORMATS,
  DOCUMENT_MIME_TYPE_SEPARATOR,
  DOCUMENT_PDF_SIGNATURE,
  DOCUMENT_ZIP_SIGNATURE,
  DocumentParseErrorCode,
} from '@/modules/knowledge/constants/document-parser.constants';
import { DocumentParseError } from '@/modules/knowledge/errors/document-parse.error';
import { documentFileName } from '@/modules/knowledge/helpers/document-file-name.helpers';

export const normalizeDocumentMimeType = (mimeType: string): string =>
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
    formatByMimeType(normalizeDocumentMimeType(mimeType));

  if (format === null) {
    throw new DocumentParseError(DocumentParseErrorCode.UnsupportedType);
  }
  return format;
};

const startsWith = (bytes: Buffer, signature: readonly number[]): boolean =>
  bytes.length >= signature.length && signature.every((value, index) => bytes[index] === value);

export const documentBytesMatchFormat = (
  format: KnowledgeDocumentFormat,
  bytes: Buffer,
): boolean => {
  if (format === KnowledgeDocumentFormat.Pdf) {
    return (
      bytes.subarray(0, DOCUMENT_PDF_SIGNATURE.length).toString('latin1') === DOCUMENT_PDF_SIGNATURE
    );
  }
  if (format === KnowledgeDocumentFormat.Docx) {
    return startsWith(bytes, DOCUMENT_ZIP_SIGNATURE);
  }
  return true;
};
