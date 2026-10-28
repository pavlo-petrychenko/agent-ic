import { describe, expect, it } from 'vitest';
import { bm25TermFrequencies, bm25Tokens } from '@/modules/knowledge/helpers/bm25.helpers';

describe('bm25Tokens', () => {
  it('normalizes, lowercases, strips diacritics and splits on non-alphanumerics', () => {
    expect(bm25Tokens('  Café  ＣＡＦＥ, don’t  ')).toEqual(['cafe', 'cafe', 'don', 't']);
  });

  it('counts repeated normalized terms', () => {
    expect(Object.fromEntries(bm25TermFrequencies('Refund refund REFUND policy'))).toEqual({
      refund: 3,
      policy: 1,
    });
  });
});
