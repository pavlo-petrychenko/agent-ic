import {
  BM25_DIACRITICS_PATTERN,
  BM25_TERM_PATTERN,
} from '@/modules/knowledge/constants/knowledge-bm25.constants';

export const bm25Tokens = (text: string): string[] =>
  text
    .normalize('NFKC')
    .toLowerCase()
    .normalize('NFD')
    .replace(BM25_DIACRITICS_PATTERN, '')
    .match(BM25_TERM_PATTERN) ?? [];

export const bm25TermFrequencies = (text: string): ReadonlyMap<string, number> => {
  const frequencies = new Map<string, number>();
  for (const term of bm25Tokens(text)) {
    frequencies.set(term, (frequencies.get(term) ?? 0) + 1);
  }
  return frequencies;
};
