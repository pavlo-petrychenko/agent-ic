import { KnowledgeDocumentFormat } from '@agent-ic/contracts';
import type { DocumentFormatDefinition } from '@/modules/knowledge/typedefs/document-parser.typedefs';

export enum DocumentParseErrorCode {
  UnsupportedType = 'UNSUPPORTED_DOCUMENT_TYPE',
  TooLarge = 'DOCUMENT_TOO_LARGE',
  TooManyTokens = 'DOCUMENT_TOO_MANY_TOKENS',
  Empty = 'DOCUMENT_EMPTY',
  Unreadable = 'DOCUMENT_UNREADABLE',
  SignatureMismatch = 'DOCUMENT_SIGNATURE_MISMATCH',
  PdfHasNoText = 'PDF_HAS_NO_TEXT',
}

export enum DocumentParseWarningCode {
  TitleTruncated = 'DOCUMENT_TITLE_TRUNCATED',
  PdfPagesWithoutText = 'PDF_PAGES_WITHOUT_TEXT',
  DocxConversion = 'DOCX_CONVERSION_WARNING',
}

export const DOCUMENT_PARSE_ERROR_MESSAGE: Readonly<Record<DocumentParseErrorCode, string>> = {
  [DocumentParseErrorCode.UnsupportedType]: 'The document type is not supported.',
  [DocumentParseErrorCode.TooLarge]: 'The document is too large.',
  [DocumentParseErrorCode.TooManyTokens]: 'The document has too many tokens.',
  [DocumentParseErrorCode.Empty]: 'The document has no extractable text.',
  [DocumentParseErrorCode.Unreadable]: 'The document could not be read.',
  [DocumentParseErrorCode.SignatureMismatch]:
    'The file contents do not match the declared document type.',
  [DocumentParseErrorCode.PdfHasNoText]: 'The PDF contains no extractable text.',
};

export const DOCUMENT_TITLE_TRUNCATED_MESSAGE = 'The document title was shortened.';
export const PDF_PAGES_WITHOUT_TEXT_MESSAGE = 'Some PDF pages contain no extractable text.';
export const DOCUMENT_UNTITLED_TITLE = 'Untitled document';
export const DOCUMENT_MIME_TYPE_SEPARATOR = ';';
export const DOCUMENT_PATH_SEPARATOR = '/';
export const DOCUMENT_WINDOWS_PATH_SEPARATOR = '\\';
export const DOCUMENT_PDF_SIGNATURE = '%PDF-';
export const DOCUMENT_ZIP_SIGNATURE: readonly number[] = [0x50, 0x4b, 0x03, 0x04];
export const PDF_PAGE_SEPARATOR = '\n\n';
export const DOCX_EMPTY_IMAGE_PATTERN = /!\[[^\]]*\]\(\)/g;

export const DOCUMENT_FORMATS: readonly DocumentFormatDefinition[] = [
  {
    format: KnowledgeDocumentFormat.Pdf,
    extensions: ['.pdf'],
    mimeTypes: ['application/pdf'],
  },
  {
    format: KnowledgeDocumentFormat.Docx,
    extensions: ['.docx'],
    mimeTypes: ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  },
  {
    format: KnowledgeDocumentFormat.Txt,
    extensions: ['.txt'],
    mimeTypes: ['text/plain'],
  },
  {
    format: KnowledgeDocumentFormat.Markdown,
    extensions: ['.md'],
    mimeTypes: ['text/markdown', 'text/x-markdown'],
  },
];
