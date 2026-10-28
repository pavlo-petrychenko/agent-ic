import { describe, expect, it } from 'vitest';
import { DocumentParseErrorCode } from '@/modules/knowledge/constants/document-parser.constants';
import { DocumentParseError } from '@/modules/knowledge/errors/document-parse.error';
import { documentTokenCount } from '@/modules/knowledge/helpers/document-token.helpers';

describe('documentTokenCount', () => {
  it('counts tokens with the cl100k tokenizer', () => {
    expect(documentTokenCount('hello world')).toBe(2);
  });

  it('allows a document at the limit', () => {
    expect(documentTokenCount('hello', 1)).toBe(1);
  });

  it('fails a document above the limit', () => {
    let failure: unknown;
    try {
      documentTokenCount('hello world', 1);
    } catch (error) {
      failure = error;
    }

    expect(failure).toBeInstanceOf(DocumentParseError);
    expect(failure).toMatchObject({ code: DocumentParseErrorCode.TooManyTokens });
  });
});
