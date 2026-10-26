import { KNOWLEDGE_DOCUMENT_MAX_TOKENS } from '@agent-ic/contracts';
import { countTokens, isWithinTokenLimit } from 'gpt-tokenizer/encoding/cl100k_base';
import { DocumentParseErrorCode } from '@/modules/knowledge/constants/document-parser.constants';
import { DocumentParseError } from '@/modules/knowledge/errors/document-parse.error';

export const textTokenCount = (text: string): number => countTokens(text);

export const documentTokenCount = (
  markdown: string,
  maxTokens = KNOWLEDGE_DOCUMENT_MAX_TOKENS,
): number => {
  const count = isWithinTokenLimit(markdown, maxTokens);
  if (count === false) {
    throw new DocumentParseError(DocumentParseErrorCode.TooManyTokens);
  }
  return count;
};
