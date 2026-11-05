export const KNOWLEDGE_BASE_NAME_MAX_LENGTH = 100;
export const KNOWLEDGE_BASE_DESCRIPTION_MAX_LENGTH = 500;
export const KNOWLEDGE_DOCUMENT_MAX_BYTES = 20 * 1024 * 1024;
export const KNOWLEDGE_DOCUMENT_MAX_TOKENS = 500_000;
export const KNOWLEDGE_DOCUMENT_TITLE_MAX_LENGTH = 500;
export const KNOWLEDGE_SOURCE_TITLE_MAX_LENGTH = 500;
export const KNOWLEDGE_SUMMARY_MAX_LENGTH = 200;

export enum KnowledgeDocumentFormat {
  Pdf = 'pdf',
  Docx = 'docx',
  Txt = 'txt',
  Markdown = 'md',
}

export enum KnowledgeDocumentFailureCode {
  UnsupportedType = 'UNSUPPORTED_DOCUMENT_TYPE',
  TooLarge = 'DOCUMENT_TOO_LARGE',
  TooManyTokens = 'DOCUMENT_TOO_MANY_TOKENS',
  Empty = 'DOCUMENT_EMPTY',
  Unreadable = 'DOCUMENT_UNREADABLE',
  SignatureMismatch = 'DOCUMENT_SIGNATURE_MISMATCH',
  PdfHasNoText = 'PDF_HAS_NO_TEXT',
}
