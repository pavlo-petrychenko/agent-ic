export const KNOWLEDGE_SUMMARY_MAX_INPUT_TOKENS = 60_000;
export const KNOWLEDGE_SUMMARY_PROMPT_OVERHEAD_TOKENS = 500;
export const KNOWLEDGE_SUMMARY_MAX_LENGTH = 500;
export const KNOWLEDGE_SUMMARY_TRACE_NAME = 'knowledge.document.summary';
export const KNOWLEDGE_SUMMARY_SYSTEM_PROMPT =
  'You summarize a document for a knowledge base. Answer with one short sentence that tells an agent what the document is about. Do not start with "This document" and do not add details that are not in the document.';
export const KNOWLEDGE_SUMMARY_TITLE_PREFIX = 'Title: ';
export const KNOWLEDGE_SUMMARY_OUTLINE_PREFIX = 'Document outline:';
export const KNOWLEDGE_SUMMARY_CONTENT_SEPARATOR = '\n\n';
export const KNOWLEDGE_SUMMARY_TRUNCATED_MESSAGE =
  'The document was shortened to fit the summary model input.';

export enum DocumentSummaryWarningCode {
  Truncated = 'DOCUMENT_SUMMARY_TRUNCATED',
}
