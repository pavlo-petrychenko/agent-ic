import { KNOWLEDGE_DOCUMENT_MAX_TOKENS } from '@agent-ic/contracts';
import {
  countTokens,
  decode,
  encode,
  isWithinTokenLimit,
} from 'gpt-tokenizer/encoding/cl100k_base';
import { DocumentParseErrorCode } from '@/modules/knowledge/constants/document-parser.constants';
import { DocumentParseError } from '@/modules/knowledge/errors/document-parse.error';

export const textTokenCount = (text: string): number => countTokens(text);

export const truncateTextToTokens = (text: string, maxTokens: number): string => {
  if (maxTokens <= 0) {
    return '';
  }
  const tokens = encode(text);
  return tokens.length <= maxTokens ? text : decode(tokens.slice(0, maxTokens));
};

export const splitTextToTokenPieces = (text: string, maxTokens: number): string[] => {
  if (maxTokens <= 0 || text.length === 0) {
    return [];
  }
  const tokens = encode(text);
  if (tokens.length <= maxTokens) {
    return [text];
  }
  const pieces: string[] = [];
  for (let start = 0; start < tokens.length; start += maxTokens) {
    pieces.push(decode(tokens.slice(start, start + maxTokens)));
  }
  return pieces;
};

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
