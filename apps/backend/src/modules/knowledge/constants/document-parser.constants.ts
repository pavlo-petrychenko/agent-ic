import { KnowledgeDocumentFailureCode, KnowledgeDocumentFormat } from '@agent-ic/contracts';
import type { DocumentFormatDefinition } from '@/modules/knowledge/typedefs/document-parser.typedefs';

export { KnowledgeDocumentFailureCode as DocumentParseErrorCode } from '@agent-ic/contracts';

export enum DocumentParseWarningCode {
  TitleTruncated = 'DOCUMENT_TITLE_TRUNCATED',
  PdfPagesWithoutText = 'PDF_PAGES_WITHOUT_TEXT',
  DocxConversion = 'DOCX_CONVERSION_WARNING',
}

export const DOCUMENT_PARSE_ERROR_MESSAGE: Readonly<Record<KnowledgeDocumentFailureCode, string>> =
  {
    [KnowledgeDocumentFailureCode.UnsupportedType]: 'The document type is not supported.',
    [KnowledgeDocumentFailureCode.TooLarge]: 'The document is too large.',
    [KnowledgeDocumentFailureCode.TooManyTokens]: 'The document has too many tokens.',
    [KnowledgeDocumentFailureCode.Empty]: 'The document has no extractable text.',
    [KnowledgeDocumentFailureCode.Unreadable]: 'The document could not be read.',
    [KnowledgeDocumentFailureCode.SignatureMismatch]:
      'The file contents do not match the declared document type.',
    [KnowledgeDocumentFailureCode.PdfHasNoText]: 'The PDF contains no extractable text.',
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
