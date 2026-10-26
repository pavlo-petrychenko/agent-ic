export const KNOWLEDGE_BASE_NAME_MAX_LENGTH = 100;
export const KNOWLEDGE_BASE_DESCRIPTION_MAX_LENGTH = 500;
export const KNOWLEDGE_DOCUMENT_MAX_BYTES = 20 * 1024 * 1024;
export const KNOWLEDGE_DOCUMENT_MAX_TOKENS = 500_000;
export const KNOWLEDGE_DOCUMENT_TITLE_MAX_LENGTH = 500;

export enum KnowledgeDocumentFormat {
  Pdf = 'pdf',
  Docx = 'docx',
  Txt = 'txt',
  Markdown = 'md',
}
